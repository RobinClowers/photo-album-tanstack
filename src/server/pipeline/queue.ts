import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'
import { createDB, type DB } from '@/db'
import {
  claimImportItem,
  finishImport,
  getImportItemImportId,
  markImportItemDone,
  markImportItemFailed,
} from '@/db/imports'
import { type ImportItem, imports } from '@/db/schema'
import { createStorage } from '@/server/storage'
import { chunk } from '@/utils/chunk'
import { finalizeAlbum } from './finalize'
import { parseImportItemPayload } from './items'
import { type PipelineDeps, reprocessPhoto } from './process-photo'
import { MAX_ATTEMPTS, retryDelaySeconds } from './retry'

/** The whole message: the import_items row holds everything else. */
export interface PhotoQueueMessage {
  itemId: number
}

/** Queues accepts at most 100 messages per sendBatch. */
const SEND_BATCH_SIZE = 100

export async function enqueueItems(
  queue: Queue<PhotoQueueMessage>,
  itemIds: readonly number[],
): Promise<void> {
  for (const slice of chunk(itemIds, SEND_BATCH_SIZE)) {
    await queue.sendBatch(slice.map((itemId) => ({ body: { itemId } })))
  }
}

/** Every dependency comes from the same Env, so a caller can swap all three. */
export function pipelineDeps(workerEnv: Env): PipelineDeps {
  return {
    db: createDB(workerEnv.photo_album),
    storage: createStorage(workerEnv.PHOTOS),
    images: workerEnv.IMAGES,
  }
}

/** Queue consumer entry point (batch size is 1 in wrangler.jsonc). */
export async function handlePhotoQueue(
  batch: MessageBatch<PhotoQueueMessage>,
  workerEnv: Env = env,
): Promise<void> {
  const deps = pipelineDeps(workerEnv)
  for (const message of batch.messages) {
    await processQueueMessage(deps, message)
  }
}

/**
 * One message: claim the item, run it, record the outcome. A failure in the
 * photo work never escapes (an uncaught throw would make the platform retry
 * the batch with no D1 record of why); the item is re-queued with a delay
 * while attempts remain and marked failed after that. Only a failure of the
 * D1 bookkeeping itself propagates, leaving the platform retry as the
 * fallback.
 */
export async function processQueueMessage(
  deps: PipelineDeps,
  message: Message<PhotoQueueMessage>,
): Promise<void> {
  const itemId = message.body?.itemId
  if (typeof itemId !== 'number') {
    console.warn('[pipeline] dropping malformed message', message.body)
    message.ack()
    return
  }
  const item = await claimImportItem(deps.db, itemId)
  if (!item) {
    // Already done or deleted: a duplicate delivery. The first delivery may
    // have died between finishing the item and closing its import, so close
    // it now rather than waiting for the sweeper.
    message.ack()
    const importId = await getImportItemImportId(deps.db, itemId)
    if (importId !== undefined) await closeImportIfFinished(deps.db, importId)
    return
  }

  const startedAt = Date.now()
  try {
    const summary = await runItem(deps, item)
    await markImportItemDone(deps.db, item.id)
    console.log(
      `[pipeline] item ${item.id} done in ${Date.now() - startedAt} ms`,
      summary,
    )
    message.ack()
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    const final = item.attempts >= MAX_ATTEMPTS
    await markImportItemFailed(deps.db, item.id, text, { final })
    console.error(
      `[pipeline] item ${item.id} attempt ${item.attempts} failed${final ? ' (final)' : ''}: ${text}`,
    )
    if (final) message.ack()
    else message.retry({ delaySeconds: retryDelaySeconds(item.attempts) })
  }

  await closeImportIfFinished(deps.db, item.importId)
}

async function runItem(deps: PipelineDeps, item: ImportItem) {
  const payload = parseImportItemPayload(item.payload)
  switch (payload.task) {
    case 'reprocess-photo':
      return reprocessPhoto(deps, {
        photoId: payload.photoId,
        force: payload.force,
      })
  }
}

/** Close the import when nothing is left in flight, then fix up its album. */
export async function closeImportIfFinished(
  db: DB,
  importId: number,
): Promise<boolean> {
  const closed = await finishImport(db, importId)
  if (!closed) return false
  const [record] = await db
    .select({ albumId: imports.albumId })
    .from(imports)
    .where(eq(imports.id, importId))
  if (record?.albumId) await finalizeAlbum(db, record.albumId)
  return true
}
