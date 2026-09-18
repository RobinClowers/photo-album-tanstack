import { isImportablePhoto, type PickedMediaItem } from '@/server/google-photos'
import { scrubFilename } from '@/utils/filename'
import type { PickedItemPayload } from './items'

/** Google's "0.001s" → 0.001; anything else → null. */
export function exposureSecondsFrom(value: string | undefined): number | null {
  const match = value ? /^(\d+(?:\.\d+)?)s$/.exec(value) : null
  const seconds = match?.[1] ? Number(match[1]) : Number.NaN
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

/** RFC 3339 → the 'YYYY-MM-DD HH:MM:SS' the photos table stores (UTC). */
export function takenAtFromCreateTime(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/** The stored shape of a picked item: scrubbed filename, flattened metadata. */
export function pickedItemToPayload(item: PickedMediaItem): PickedItemPayload {
  const meta = item.mediaFile.mediaFileMetadata
  const photo = meta?.photoMetadata
  return {
    id: item.id,
    baseUrl: item.mediaFile.baseUrl,
    filename: scrubFilename(item.mediaFile.filename),
    mimeType: item.mediaFile.mimeType.toLowerCase(),
    createTime: item.createTime,
    width: meta?.width ?? null,
    height: meta?.height ?? null,
    cameraMake: meta?.cameraMake ?? null,
    cameraModel: meta?.cameraModel ?? null,
    focalLength: photo?.focalLength ?? null,
    apertureFNumber: photo?.apertureFNumber ?? null,
    isoEquivalent: photo?.isoEquivalent ?? null,
    exposureSeconds: exposureSecondsFrom(photo?.exposureTime),
  }
}

export interface ExistingPhotoRef {
  googleId: string | null
  filename: string | null
}

export interface PickPlan {
  toImport: PickedItemPayload[]
  skipped: {
    /** Already in the album with the same Google id. */
    existingById: number
    /** Already in the album under the same (scrubbed) filename. */
    existingByFilename: number
    /** Videos and formats the pipeline cannot resize. */
    unsupported: number
    /** Two picked items scrub to the same filename; the first wins. */
    duplicateFilename: number
  }
}

/**
 * Decide which picked items become import items. Dedupe is by Google id
 * first, then by filename, matching the Rails importer's behaviour so a
 * re-import of an album is a no-op for photos it already has.
 */
export function planPickedItems(
  items: PickedMediaItem[],
  existing: ExistingPhotoRef[],
): PickPlan {
  const byGoogleId = new Set(
    existing.map((p) => p.googleId).filter((v): v is string => Boolean(v)),
  )
  const byFilename = new Set(
    existing.map((p) => p.filename).filter((v): v is string => Boolean(v)),
  )
  const plan: PickPlan = {
    toImport: [],
    skipped: {
      existingById: 0,
      existingByFilename: 0,
      unsupported: 0,
      duplicateFilename: 0,
    },
  }
  const seen = new Set<string>()
  for (const item of items) {
    if (!isImportablePhoto(item)) {
      plan.skipped.unsupported++
      continue
    }
    const payload = pickedItemToPayload(item)
    if (byGoogleId.has(payload.id)) {
      plan.skipped.existingById++
      continue
    }
    if (byFilename.has(payload.filename)) {
      plan.skipped.existingByFilename++
      continue
    }
    if (seen.has(payload.filename)) {
      plan.skipped.duplicateFilename++
      continue
    }
    seen.add(payload.filename)
    plan.toImport.push(payload)
  }
  return plan
}
