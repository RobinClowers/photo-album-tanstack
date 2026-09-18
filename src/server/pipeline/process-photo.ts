import { eq } from 'drizzle-orm'
import type { DB } from '@/db'
import { getPhotoWithVersions } from '@/db/queries'
import { type Photo, photos, photoVersions } from '@/db/schema'
import { isRotated, type PhotoExif, parseExif } from '@/server/images/exif'
import {
  type Dimensions,
  ORIGINAL_SIZE,
  PHOTO_SIZE_NAMES,
  planVariants,
  VARIANT_MIME_TYPE,
  VARIANT_QUALITY,
} from '@/server/images/sizes'
import type { Storage } from '@/server/storage'
import { variantFilename } from '@/utils/filename'
import { photoObjectKey } from '@/utils/photo'

/** Cloudflare Images input limit; larger originals are flagged, not resized. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024

export interface PipelineDeps {
  db: DB
  storage: Storage
  images: ImagesBinding
}

export interface ReprocessResult {
  /** Sizes whose variant was generated and uploaded. */
  generated: string[]
  /** Sizes left alone because a version row already existed (non-force). */
  kept: string[]
  /** Sizes the original is too small for. */
  tooSmall: string[]
}

/**
 * Regenerate a photo's size variants from its stored original and backfill
 * the photos row from EXIF. Runs inside one queue message, so the shape is
 * "a few fetches and a few D1 writes": the original is read once, each
 * variant is one Images transform (pixel work happens in Cloudflare's
 * image service, not here) followed by one S3 PUT and one upsert.
 *
 * With `force` false, sizes that already have a photo_versions row are kept;
 * with `force` true every size is rebuilt and overwritten.
 */
export interface ReprocessOptions {
  photoId: number
  force: boolean
  /**
   * Bytes to resize instead of the stored original, used when the original
   * is above the Images input limit and a smaller copy came from Google.
   * `originalDimensions` are recorded on the `original` version row and the
   * photo when known, since the bytes here are not the original's.
   */
  source?: { bytes: ArrayBuffer; originalDimensions?: Dimensions | undefined }
}

export async function reprocessPhoto(
  deps: PipelineDeps,
  options: ReprocessOptions,
): Promise<ReprocessResult> {
  const { db, storage, images } = deps
  const photo = await getPhotoWithVersions(db, options.photoId)
  if (!photo) throw new Error(`Photo ${options.photoId} no longer exists`)
  if (!photo.path || !photo.filename) {
    throw new Error(`Photo ${photo.id} has no path or filename`)
  }
  const { path, filename } = photo

  const existing = new Set(
    photo.versions.map((v) => v.size).filter((s): s is string => Boolean(s)),
  )
  // Nothing missing: skip the download and the Images calls entirely rather
  // than fetching a multi-megabyte original just to keep every size.
  if (
    !options.force &&
    existing.has(ORIGINAL_SIZE) &&
    PHOTO_SIZE_NAMES.every((name) => existing.has(name))
  ) {
    return { generated: [], kept: [...PHOTO_SIZE_NAMES], tooSmall: [] }
  }

  let bytes: ArrayBuffer
  if (options.source) {
    bytes = options.source.bytes
  } else {
    const originalKey = photoObjectKey(path, ORIGINAL_SIZE, filename)
    const original = await storage.get(originalKey)
    if (!original)
      throw new Error(`Original not found in storage: ${originalKey}`)
    const declared = Number(original.headers.get('content-length') ?? 0)
    if (declared > MAX_SOURCE_BYTES) {
      await original.body?.cancel()
      throw new Error(
        `Original is ${(declared / 1024 / 1024).toFixed(1)} MB, above the 20 MB Images limit`,
      )
    }
    bytes = await original.arrayBuffer()
  }
  if (bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error(
      `Source is ${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB, above the 20 MB Images limit`,
    )
  }
  // One Blob feeds every Images call: constructing a Blob copies its bytes,
  // while each stream() reads the same copy.
  const blob = new Blob([bytes])

  // The Images round trip and the EXIF parse are independent, so they
  // overlap. EXIF is best effort: a photo without readable EXIF is still
  // resized, but a parser failure is logged so a systematic one is visible.
  const [info, exif] = await Promise.all([
    images.info(blob.stream()),
    parseExif(bytes).catch((error: unknown) => {
      console.warn(`[pipeline] EXIF parse failed for photo ${photo.id}:`, error)
      return null
    }),
  ])
  if (!('width' in info) || !info.width || !info.height) {
    throw new Error(`Could not read image dimensions (${info.format})`)
  }
  // Stored pixel dimensions; the displayed image is rotated when EXIF says
  // so, and the Images service applies that rotation to every variant.
  const sourceDimensions: Dimensions = isRotated(exif?.orientation ?? null)
    ? { width: info.height, height: info.width }
    : { width: info.width, height: info.height }
  // Variants are planned from the bytes at hand; the original row records
  // the true original when a resized stand-in is being processed.
  const dimensions = sourceDimensions
  const originalDimensions =
    options.source?.originalDimensions ?? sourceDimensions

  const now = new Date().toISOString()
  const planned = planVariants(dimensions)
  const plannedNames = new Set(planned.map((p) => p.size.name))
  const result: ReprocessResult = {
    generated: [],
    kept: [],
    tooSmall: PHOTO_SIZE_NAMES.filter((name) => !plannedNames.has(name)),
  }

  for (const variant of planned) {
    if (!options.force && existing.has(variant.size.name)) {
      result.kept.push(variant.size.name)
      continue
    }
    const output = await images
      .input(blob.stream())
      .transform({ height: variant.height, fit: 'scale-down' })
      .output({ format: VARIANT_MIME_TYPE, quality: VARIANT_QUALITY })
    // The transform result has no known length, so it is buffered for the
    // PUT (a native copy, not per-byte JavaScript work).
    const body = await output.response().arrayBuffer()
    const variantName = variantFilename(filename)
    await storage.put(
      photoObjectKey(path, variant.size.name, variantName),
      body,
      {
        contentType: VARIANT_MIME_TYPE,
      },
    )
    await upsertVersion(db, {
      photoId: photo.id,
      size: variant.size.name,
      filename: variantName,
      mimeType: VARIANT_MIME_TYPE,
      width: variant.width,
      height: variant.height,
      now,
    })
    result.generated.push(variant.size.name)
  }

  await upsertVersion(db, {
    photoId: photo.id,
    size: ORIGINAL_SIZE,
    filename,
    mimeType: options.source ? (photo.mimeType ?? info.format) : info.format,
    width: originalDimensions.width,
    height: originalDimensions.height,
    now,
  })
  await backfillPhoto(
    db,
    photo,
    originalDimensions,
    options.source ? (photo.mimeType ?? info.format) : info.format,
    exif,
    options.force,
  )
  return result
}

async function upsertVersion(
  db: DB,
  v: {
    photoId: number
    size: string
    filename: string
    mimeType: string
    width: number
    height: number
    now: string
  },
) {
  await db
    .insert(photoVersions)
    .values({
      photoId: v.photoId,
      size: v.size,
      filename: v.filename,
      mimeType: v.mimeType,
      width: v.width,
      height: v.height,
      createdAt: v.now,
      updatedAt: v.now,
    })
    .onConflictDoUpdate({
      target: [photoVersions.photoId, photoVersions.size],
      set: {
        filename: v.filename,
        mimeType: v.mimeType,
        width: v.width,
        height: v.height,
        updatedAt: v.now,
      },
    })
}

/**
 * Fields the photos row is missing, filled from what the pipeline learned.
 * Existing values win unless `force`: an admin may have corrected a date by
 * hand, and a reprocess should not undo that.
 */
export function photoBackfill(
  photo: Photo,
  dimensions: Dimensions,
  mimeType: string,
  exif: PhotoExif | null,
  force: boolean,
): Partial<Photo> {
  const patch: Partial<Photo> = {}
  const fill = <K extends keyof Photo>(key: K, value: Photo[K] | null) => {
    if (value === null || value === undefined) return
    if (force || photo[key] === null || photo[key] === undefined) {
      patch[key] = value
    }
  }
  fill('width', dimensions.width)
  fill('height', dimensions.height)
  fill('mimeType', mimeType)
  if (exif) {
    fill('takenAt', exif.takenAt)
    fill('cameraMake', exif.cameraMake)
    fill('cameraModel', exif.cameraModel)
    fill('focalLength', exif.focalLength)
    fill('apertureFNumber', exif.apertureFNumber)
    fill('isoEquivalent', exif.isoEquivalent)
    fill('exposureTime', exif.exposureTime)
    fill('lat', exif.lat)
    fill('lon', exif.lon)
  }
  return patch
}

async function backfillPhoto(
  db: DB,
  photo: Photo,
  dimensions: Dimensions,
  mimeType: string,
  exif: PhotoExif | null,
  force: boolean,
) {
  const patch = photoBackfill(photo, dimensions, mimeType, exif, force)
  if (Object.keys(patch).length === 0) return
  await db
    .update(photos)
    .set({ ...patch, updatedAt: new Date().toISOString() })
    .where(eq(photos.id, photo.id))
}
