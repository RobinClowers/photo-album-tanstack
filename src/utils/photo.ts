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
