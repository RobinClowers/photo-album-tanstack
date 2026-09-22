import { env } from 'cloudflare:workers'
import { createDB } from '@/db'
import {
  cancelExpiredPickingImports,
  findStaleImportItems,
  listClosableImportIds,
  touchImportItems,
} from '@/db/imports'
import { closeImportIfFinished, enqueueItems } from './queue'

/**
 * An item that has not been touched for this long has lost its message:
 * Queues retention is 24 h, a consumer can die mid-item, and a send can fail
 * after the rows were written. Well above any legitimate retry delay.
 */
export const STALE_ITEM_MS = 60 * 60 * 1000

/**
 * A Google import still 'picking' this long after its last update, with no
 * session expiry recorded, was abandoned; Google's own sessions last a week.
 */
export const STALE_PICKING_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Cron entry point (every ten minutes): re-enqueue stale items, close any
 * import whose completion was missed, and cancel picking sessions the admin
 * walked away from. D1 is the source of truth, so this is what makes the
 * pipeline eventually consistent with lost messages.
 */
export async function sweepStaleItems(workerEnv: Env = env): Promise<void> {
  const db = createDB(workerEnv.photo_album)
  const stale = await findStaleImportItems(db, STALE_ITEM_MS)
  if (stale.length > 0) {
    // Bump updated_at first so the next sweep does not re-send the same ids
    // before the consumer has had a chance to claim them.
    await touchImportItems(db, stale)
    await enqueueItems(workerEnv.PHOTO_QUEUE, stale)
  }
  // One query finds the imports with nothing in flight; closing re-counts
  // each of the (few) candidates, so a message finishing in between is safe.
  let closed = 0
  for (const importId of await listClosableImportIds(db)) {
    if (await closeImportIfFinished(db, importId)) closed++
  }
  const expired = await cancelExpiredPickingImports(db, STALE_PICKING_MS)
  console.log(
    `[sweeper] re-enqueued ${stale.length} stale item(s), closed ${closed} import(s), cancelled ${expired} expired pick(s)`,
  )
}
