import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  claimPickingImport,
  createImport,
  getImport,
  insertImportItems,
  setImportStatus,
} from '@/db/imports'
import { getAlbum } from '@/db/queries'
import { type Import, photos } from '@/db/schema'
import {
  GoogleReauthRequired,
  getGoogleConnection,
  getValidAccessToken,
} from '@/server/google-auth'
import {
  createPickerSession,
  deletePickerSession,
  durationToMs,
  GooglePhotosError,
  getPickerSession,
  listPickedMediaItems,
} from '@/server/google-photos'
import {
  emptyPickSkipped,
  type PickPlan,
  planPickedItems,
} from '@/server/pipeline/google-plan'
import { serializeImportItemPayload } from '@/server/pipeline/items'
import { enqueueItems } from '@/server/pipeline/queue'
import { requireAdmin } from './auth'
import { db, id, validate } from './shared'

const DEFAULT_POLL_MS = 5000

/** Where the admin stands with Google Photos; drives the import dialog. */
export const adminGoogleStatus = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async ({ context }) => getGoogleConnection(db(), context.user.id))

export type StartPickResult =
  | { status: 'reauth' }
  | {
      status: 'picking'
      importId: number
      pickerUri: string
      pollIntervalMs: number
      expiresAt: string | null
    }

/**
 * Open a Google Photos picking session for an album. The UI sends the admin
 * to `pickerUri` and polls `adminPollGooglePick` until they finish.
 */
export const adminStartGooglePick = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ albumId: id }), input),
  )
  .handler(async ({ data, context }): Promise<StartPickResult> => {
    const album = await getAlbum(db(), data.albumId)
    if (!album?.slug) throw new Error('Album not found')
    let accessToken: string
    try {
      accessToken = await getValidAccessToken(db(), context.user.id)
    } catch (error) {
      if (error instanceof GoogleReauthRequired) return { status: 'reauth' }
      throw error
    }
    const session = await createPickerSession(accessToken)
    const { import: record } = await createImport(
      db(),
      {
        albumId: album.id,
        kind: 'google',
        createdByUserId: context.user.id,
        googleSessionId: session.id,
        googleSessionExpiresAt: session.expireTime ?? null,
        status: 'picking',
      },
      [],
    )
    return {
      status: 'picking',
      importId: record.id,
      pickerUri: session.pickerUri,
      pollIntervalMs: durationToMs(
        session.pollingConfig?.pollInterval,
        DEFAULT_POLL_MS,
      ),
      expiresAt: session.expireTime ?? null,
    }
  })

export type PollPickResult =
  | { status: 'picking'; pollIntervalMs: number }
  | { status: 'reauth' }
  | { status: 'expired' }
  | { status: 'running' | 'done'; queued: number; skipped: PickPlan['skipped'] }
  | { status: 'cancelled' | 'failed' }

async function ownedPickingImport(
  importId: number,
  userId: number,
): Promise<Import> {
  const record = await getImport(db(), importId)
  if (record?.kind !== 'google' || record.createdByUserId !== userId) {
    throw new Error('Import not found')
  }
  return record
}

/** The result for an import that an earlier poll already moved past picking. */
function settledPickResult(status: string): PollPickResult {
  if (status === 'running' || status === 'done') {
    return { status, queued: 0, skipped: emptyPickSkipped() }
  }
  return { status: status === 'cancelled' ? 'cancelled' : 'failed' }
}

/**
 * One poll of a picking session. When Google reports the selection is made,
 * this lists the picked items, plans them against the album (dedupe by
 * Google id, then filename), inserts the import items and enqueues them.
 */
export const adminPollGooglePick = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ importId: id }), input),
  )
  .handler(async ({ data, context }): Promise<PollPickResult> => {
    const record = await ownedPickingImport(data.importId, context.user.id)
    if (record.status !== 'picking') return settledPickResult(record.status)
    if (!record.googleSessionId || !record.albumId) {
      await setImportStatus(db(), record.id, 'failed', {
        error: 'Picking session was not recorded',
      })
      return { status: 'failed' }
    }

    let accessToken: string
    try {
      accessToken = await getValidAccessToken(db(), context.user.id)
    } catch (error) {
      if (error instanceof GoogleReauthRequired) return { status: 'reauth' }
      throw error
    }

    let session: Awaited<ReturnType<typeof getPickerSession>>
    try {
      session = await getPickerSession(accessToken, record.googleSessionId)
    } catch (error) {
      if (error instanceof GooglePhotosError && error.status === 404) {
        await setImportStatus(db(), record.id, 'failed', {
          error:
            'Google Photos picking session expired before any photos were chosen',
        })
        return { status: 'expired' }
      }
      throw error
    }
    if (!session.mediaItemsSet) {
      return {
        status: 'picking',
        pollIntervalMs: durationToMs(
          session.pollingConfig?.pollInterval,
          DEFAULT_POLL_MS,
        ),
      }
    }

    const items = await listPickedMediaItems(
      accessToken,
      record.googleSessionId,
    )
    const existing = await db()
      .select({ googleId: photos.googleId, filename: photos.filename })
      .from(photos)
      .where(eq(photos.albumId, record.albumId))
    const plan = planPickedItems(items, existing)
    console.log(
      `[google] import ${record.id}: picked ${items.length}, importing ${plan.toImport.length}`,
      plan.skipped,
    )
    // Claim the import before writing anything: a second poll in flight (a
    // retried request, the dialog open in another tab) must not insert the
    // same picks twice. Whoever lost the claim reports what the winner did.
    if (!(await claimPickingImport(db(), record.id))) {
      const current = await getImport(db(), record.id)
      return settledPickResult(current?.status ?? 'failed')
    }
    let itemIds: number[]
    try {
      itemIds = await insertImportItems(
        db(),
        record.id,
        plan.toImport.map((item) => ({
          filename: item.filename,
          googleMediaId: item.id,
          payload: serializeImportItemPayload({
            task: 'google-import',
            albumId: record.albumId as number,
            item,
          }),
        })),
      )
    } catch (error) {
      // Hand the import back to the next poll rather than leaving it
      // 'running' with no items, which nothing would ever close.
      await setImportStatus(db(), record.id, 'picking')
      throw error
    }
    if (itemIds.length === 0) {
      // Everything picked was already in the album: nothing to run, so the
      // import is closed directly (finishImport only closes imports that had
      // items, so the sweeper cannot do it either).
      await setImportStatus(db(), record.id, 'done')
    } else {
      await enqueueItems(env.PHOTO_QUEUE, itemIds)
    }
    // The session is deliberately left open: "Retry failed" re-lists it for
    // fresh download links (google-retry.ts) until Google expires it.
    return {
      status: itemIds.length === 0 ? 'done' : 'running',
      queued: itemIds.length,
      skipped: plan.skipped,
    }
  })

/** Abandon a session the admin closed without picking. */
export const adminCancelGooglePick = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ importId: id }), input),
  )
  .handler(async ({ data, context }) => {
    const record = await ownedPickingImport(data.importId, context.user.id)
    if (record.status !== 'picking') return { status: record.status }
    await setImportStatus(db(), record.id, 'cancelled')
    if (record.googleSessionId) {
      try {
        const token = await getValidAccessToken(db(), context.user.id)
        await deletePickerSession(token, record.googleSessionId)
      } catch {
        // Best effort; the session expires on its own.
      }
    }
    return { status: 'cancelled' as const }
  })
