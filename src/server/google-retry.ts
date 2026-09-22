import type { DB } from '@/db'
import { listImportItems, setImportItemPayload } from '@/db/imports'
import type { Import } from '@/db/schema'
import { GoogleReauthRequired, getValidAccessToken } from './google-auth'
import { GooglePhotosError, listPickedMediaItems } from './google-photos'
import {
  parseImportItemPayload,
  serializeImportItemPayload,
} from './pipeline/items'

/**
 * Google download URLs expire about an hour after picking, so retrying a
 * failed Google import first re-lists the (still open) picker session and
 * swaps fresh `baseUrl`s into the failed items' payloads. Returns how many
 * were refreshed. Throws a plain Error the admin can act on when the session
 * itself is gone or Google access has lapsed.
 */
export async function refreshGoogleDownloadUrls(
  db: DB,
  record: Import,
): Promise<number> {
  if (record.kind !== 'google' || !record.googleSessionId) return 0
  if (!record.createdByUserId) return 0

  let accessToken: string
  try {
    accessToken = await getValidAccessToken(db, record.createdByUserId)
  } catch (error) {
    if (error instanceof GoogleReauthRequired) {
      throw new Error(
        'Google Photos access has expired; reconnect it from the album page, then retry',
      )
    }
    throw error
  }

  let picked: Awaited<ReturnType<typeof listPickedMediaItems>>
  try {
    picked = await listPickedMediaItems(accessToken, record.googleSessionId)
  } catch (error) {
    if (error instanceof GooglePhotosError && error.status === 404) {
      throw new Error(
        'The Google picker session has expired, so the download links cannot be refreshed. Start a new import and pick the missing photos again.',
      )
    }
    throw error
  }
  const freshUrls = new Map(picked.map((p) => [p.id, p.mediaFile.baseUrl]))

  let refreshed = 0
  for (const item of await listImportItems(db, record.id)) {
    if (item.status !== 'failed') continue
    const payload = parseImportItemPayload(item.payload)
    if (payload.task !== 'google-import') continue
    const baseUrl = freshUrls.get(payload.item.id)
    if (!baseUrl || baseUrl === payload.item.baseUrl) continue
    await setImportItemPayload(
      db,
      item.id,
      serializeImportItemPayload({
        ...payload,
        item: { ...payload.item, baseUrl },
      }),
    )
    refreshed++
  }
  return refreshed
}
