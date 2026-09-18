import { and, eq } from 'drizzle-orm'
import type { DB } from '@/db'
import { getImport, setImportItemPhoto } from '@/db/imports'
import { getAlbum } from '@/db/queries'
import { type ImportItem, type Photo, photos } from '@/db/schema'
import { GoogleReauthRequired, getValidAccessToken } from '@/server/google-auth'
import { originalDownloadUrl, resizedDownloadUrl } from '@/server/google-photos'
import { formatExposureTime } from '@/server/images/exif'
import { ORIGINAL_SIZE, PHOTO_SIZES } from '@/server/images/sizes'
import { photoObjectKey } from '@/utils/photo'
import { takenAtFromCreateTime } from './google-plan'
import type { PickedItemPayload } from './items'
import {
  MAX_SOURCE_BYTES,
  type PipelineDeps,
  type ReprocessResult,
  reprocessPhoto,
} from './process-photo'

/**
 * A failure that retrying will not fix: the consumer marks the item failed
 * at once instead of burning the remaining attempts.
 */
export class PermanentImportError extends Error {
  readonly permanent = true
  constructor(message: string) {
    super(message)
    this.name = 'PermanentImportError'
  }
}

export function isPermanentError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { permanent?: unknown }).permanent === true
  )
}

const LARGEST_VARIANT_PX = Math.max(...PHOTO_SIZES.map((s) => s.height))

async function findPhotoInAlbum(
  db: DB,
  albumId: number,
  filename: string,
): Promise<Photo | undefined> {
  const [photo] = await db
    .select()
    .from(photos)
    .where(and(eq(photos.albumId, albumId), eq(photos.filename, filename)))
  return photo
}

/**
 * Import one picked Google Photos item: download the original into the
 * bucket, create the photos row from the Picker metadata, then reuse the
 * reprocess path to generate variants and backfill EXIF. Idempotent per
 * (album, filename): a retry after a partial failure picks up where it got
 * to instead of downloading again.
 */
export async function importGooglePhoto(
  deps: PipelineDeps,
  item: ImportItem,
  payload: { albumId: number; item: PickedItemPayload },
): Promise<ReprocessResult & { downloaded: boolean }> {
  const { db, storage } = deps
  const record = await getImport(db, item.importId)
  if (!record?.createdByUserId) {
    throw new PermanentImportError(
      'Import has no owner to fetch Google tokens for',
    )
  }
  const album = await getAlbum(db, payload.albumId)
  if (!album?.slug) throw new PermanentImportError('Album no longer exists')
  const picked = payload.item

  let photo = await findPhotoInAlbum(db, album.id, picked.filename)
  let downloaded = false
  let oversized = false
  let accessToken: string | undefined

  if (!photo) {
    accessToken = await tokenFor(db, record.createdByUserId)
    const res = await fetch(originalDownloadUrl(picked.baseUrl), {
      headers: { authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 401) {
      await res.body?.cancel()
      throw new PermanentImportError(
        'Google rejected the access token; reconnect Google Photos and retry',
      )
    }
    if (res.status === 403 || res.status === 404 || res.status === 410) {
      await res.body?.cancel()
      throw new PermanentImportError(
        `Google download link no longer valid (${res.status}); links last about an hour, use Retry failed to refresh them`,
      )
    }
    if (!res.ok || !res.body) {
      await res.body?.cancel()
      throw new Error(`Google download failed with status ${res.status}`)
    }
    const length = Number(res.headers.get('content-length') ?? 0)
    oversized = length > MAX_SOURCE_BYTES
    await storage.put(
      photoObjectKey(album.slug, ORIGINAL_SIZE, picked.filename),
      res.body,
      {
        contentType: picked.mimeType,
        ...(length > 0 ? { contentLength: length } : {}),
      },
    )
    downloaded = true
    photo = await createPhotoRow(db, album.id, album.slug, picked)
    await setImportItemPhoto(db, item.id, photo.id)
  } else if (item.photoId !== photo.id) {
    await setImportItemPhoto(db, item.id, photo.id)
  }

  if (oversized) {
    // Above the Images input limit: keep the original as uploaded and let
    // Google resize a copy large enough for every variant.
    accessToken ??= await tokenFor(db, record.createdByUserId)
    const res = await fetch(
      resizedDownloadUrl(picked.baseUrl, LARGEST_VARIANT_PX),
      { headers: { authorization: `Bearer ${accessToken}` } },
    )
    if (!res.ok) {
      await res.body?.cancel()
      throw new Error(
        `Google resized download failed with status ${res.status}`,
      )
    }
    const result = await reprocessPhoto(deps, {
      photoId: photo.id,
      force: false,
      source: {
        bytes: await res.arrayBuffer(),
        originalDimensions:
          picked.width && picked.height
            ? { width: picked.width, height: picked.height }
            : undefined,
      },
    })
    return { ...result, downloaded }
  }

  // Not forced: the Picker metadata already on the row wins over EXIF, and
  // only the missing columns are filled in.
  const result = await reprocessPhoto(deps, { photoId: photo.id, force: false })
  return { ...result, downloaded }
}

async function tokenFor(db: DB, userId: number): Promise<string> {
  try {
    return await getValidAccessToken(db, userId)
  } catch (error) {
    if (error instanceof GoogleReauthRequired) {
      throw new PermanentImportError(error.message)
    }
    throw error
  }
}

async function createPhotoRow(
  db: DB,
  albumId: number,
  slug: string,
  picked: PickedItemPayload,
): Promise<Photo> {
  const now = new Date().toISOString()
  const [created] = await db
    .insert(photos)
    .values({
      filename: picked.filename,
      path: slug,
      albumId,
      mimeType: picked.mimeType,
      googleId: picked.id,
      takenAt: takenAtFromCreateTime(picked.createTime),
      width: picked.width,
      height: picked.height,
      cameraMake: picked.cameraMake,
      cameraModel: picked.cameraModel,
      focalLength: picked.focalLength,
      apertureFNumber: picked.apertureFNumber,
      isoEquivalent: picked.isoEquivalent,
      exposureTime: formatExposureTime(picked.exposureSeconds),
      createdAt: now,
      updatedAt: now,
    })
    // (path, filename) is unique: a concurrent duplicate delivery may have
    // won the race, in which case the existing row is the one to use.
    .onConflictDoNothing()
    .returning()
  if (created) return created
  const existing = await findPhotoInAlbum(db, albumId, picked.filename)
  if (!existing) throw new Error('Photo row vanished after insert conflict')
  return existing
}
