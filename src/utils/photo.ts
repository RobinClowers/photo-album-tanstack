import type { Photo, PhotoVersion } from '@/db/schema'

export const BASE_PHOTO_PATH = 'https://s3.amazonaws.com/robin-photos/'

export type PhotoWithVersions = Photo & { versions: PhotoVersion[] }

export function buildPhotoPath(
  photo: PhotoWithVersions | null | undefined,
  size: string,
) {
  if (!photo?.versions?.length) return ''
  const version =
    photo.versions.find((v) => v.size === size) || photo.versions[0]
  if (!version) return ''
  return `${BASE_PHOTO_PATH}${photo.path}/${size}/${version.filename}`
}

export function buildPhotoSrcSet(photo: PhotoWithVersions | null | undefined) {
  if (!photo?.versions?.length) return undefined
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
        `${BASE_PHOTO_PATH}${photo.path}/${v.size}/${v.filename} ${v.width}w`,
    )
  return entries.length ? entries.join(', ') : undefined
}
