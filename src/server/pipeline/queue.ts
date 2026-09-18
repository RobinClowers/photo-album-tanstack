import { env } from 'cloudflare:workers'
import { eq } from 'drizzle-orm'
import { createDB, type DB } from '@/db'
import {
  claimImportItem,
  finishImport,
  markImportItemDone,
  markImportItemFailed,
} from '@/db/imports'
import { type ImportItem, imports } from '@/db/schema'
import { getStorage } from '@/server/storage'
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
  options: { delaySeconds?: number } = {},
): Promise<void> {
  for (let i = 0; i < itemIds.length; i += SEND_BATCH_SIZE) {
    await queue.sendBatch(
      itemIds.slice(i, i + SEND_BATCH_SIZE).map((itemId) => ({
        body: { itemId },
        ...(options.delaySeconds ? { delaySeconds: options.delaySeconds } : {}),
      })),
    )
  }
}

export function pipelineDeps(workerEnv: Env): PipelineDeps {
  return {
    db: createDB(workerEnv.photo_album),
    storage: getStorage(),
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
 * One message: claim the item, run it, record the outcome. Errors never
 * escape (an uncaught throw would make the platform retry the whole batch
 * with no D1 record of why); instead the item is re-queued with a delay
 * while attempts remain and marked failed after that.
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
    // Already done or deleted: a duplicate delivery.
    message.ack()
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
