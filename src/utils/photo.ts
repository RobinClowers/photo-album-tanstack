import type { Photo, PhotoVersion } from '@/db/schema'

/**
 * Public base URL for photo objects. Build-time configurable per Vite mode
 * (see .env.staging) so staging can point at its own bucket. Normalized to
 * exactly one trailing slash so a configured value without one still works.
 */
export const BASE_PHOTO_PATH = (
  import.meta.env.VITE_PHOTO_BASE_URL ||
  'https://s3.amazonaws.com/robin-photos/'
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

export function buildPhotoPath(
  photo: PhotoWithVersions | null | undefined,
  size: string,
) {
  if (!photo?.versions?.length) return ''
  const version =
    photo.versions.find((v) => v.size === size) || photo.versions[0]
  if (!version) return ''
  if (!photo.path || !version.filename) return ''
  return `${BASE_PHOTO_PATH}${photoObjectKey(photo.path, size, version.filename)}`
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
