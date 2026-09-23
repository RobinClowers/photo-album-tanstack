import type { Photo, PhotoVersion } from '@/db/schema'
import { PHOTO_SIZES } from '@/server/images/sizes'

/**
 * Public base URL for photo objects: the R2 bucket's custom domain.
 * Build-time configurable per Vite mode (see .env.staging) so staging reads
 * from its own bucket. Normalized to exactly one trailing slash so a
 * configured value without one still works.
 */
export const BASE_PHOTO_PATH = (
  import.meta.env.VITE_PHOTO_BASE_URL || 'https://img.robinclowers.com/'
).replace(/\/?$/, '/')

export type PhotoWithVersions = Photo & { versions: PhotoVersion[] }

/** Shared by the caption input and the server-side caption validator. */
export const CAPTION_MAX_LENGTH = 2000

/**
 * Storage key of one object: `<album-slug>/<size>/<filename>`. Shared by the
 * public URL builders below and the S3 client, so the two can never drift.
 */
export function photoObjectKey(path: string, size: string, filename: string) {
  return `${path}/${size}/${filename}`
}

/**
 * Every object key a photo owns: one per `photo_versions` row (the original
 * is stored as a version too). Rows missing a size or filename, or a photo
 * with no path, yield nothing rather than a malformed key.
 */
export function photoObjectKeys(
  photo: Pick<Photo, 'path'>,
  versions: readonly Pick<PhotoVersion, 'size' | 'filename'>[],
): string[] {
  if (!photo.path) return []
  const keys = new Set<string>()
  for (const version of versions) {
    if (!version.size || !version.filename) continue
    keys.add(photoObjectKey(photo.path, version.size, version.filename))
  }
  return [...keys]
}

type SizedVersion = PhotoVersion & { size: string; filename: string }

/**
 * The version to show for a requested size. A variant is only missing when
 * the original was too small to produce it, so the fallback is the smallest
 * version at least as tall as the requested size, else the tallest one
 * (normally the original itself).
 */
function versionForSize(
  versions: readonly PhotoVersion[],
  size: string,
): SizedVersion | undefined {
  const usable = versions.filter(
    (v): v is SizedVersion => Boolean(v.size) && Boolean(v.filename),
  )
  const exact = usable.find((v) => v.size === size)
  if (exact) return exact
  const byHeight = [...usable].sort((a, b) => (a.height ?? 0) - (b.height ?? 0))
  const target = PHOTO_SIZES.find((s) => s.name === size)?.height ?? Infinity
  return byHeight.find((v) => (v.height ?? 0) >= target) ?? byHeight.at(-1)
}

export function buildPhotoPath(
  photo: PhotoWithVersions | null | undefined,
  size: string,
) {
  if (!photo?.versions?.length || !photo.path) return ''
  const version = versionForSize(photo.versions, size)
  if (!version) return ''
  // Key by the chosen version's own size: a fallback lives under its size's
  // folder, not the requested one.
  return `${BASE_PHOTO_PATH}${photoObjectKey(photo.path, version.size, version.filename)}`
}

export function buildPhotoSrcSet(photo: PhotoWithVersions | null | undefined) {
  if (!photo?.versions?.length || !photo.path) return undefined
  const path = photo.path
  const entries = photo.versions
    .filter(
      (
        v,
      ): v is PhotoVersion & {
        size: string
        filename: string
        width: number
      } =>
        Boolean(v.size) &&
        v.size !== 'original' &&
        Boolean(v.filename) &&
        Boolean(v.width),
    )
    .sort((a, b) => a.width - b.width)
    .map(
      (v) =>
        `${BASE_PHOTO_PATH}${photoObjectKey(path, v.size, v.filename)} ${v.width}w`,
    )
  return entries.length ? entries.join(', ') : undefined
}
