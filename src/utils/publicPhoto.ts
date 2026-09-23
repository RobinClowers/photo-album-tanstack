import {
  buildPhotoPath,
  buildPhotoSrcSet,
  type PhotoWithVersions,
} from './photo'

/**
 * The public pages get only what they render. Full photo rows carry EXIF and
 * GPS columns, and every photo_versions row, none of which the browser needs;
 * serializing them into the hydration payload grew with album size and
 * exposed each photo's location. These mappers run inside the server
 * functions so the raw rows never leave the server.
 */

export interface GridPhoto {
  id: number
  filename: string
  caption: string | null
  /** Width / height of the original, used to size the tile in its row. */
  aspectRatio: number
  src: string
  srcSet: string | undefined
}

export interface CoverPhoto {
  src: string
  srcSet: string | undefined
}

export interface PhotoPageData {
  caption: string | null
  albumTitle: string | null
  /** The large version shown on the page. */
  src: string
  original: { src: string; width: number | null; height: number | null }
}

function originalVersion(photo: PhotoWithVersions) {
  return photo.versions.find((v) => v.size === 'original')
}

/** Photos without original dimensions can't be laid out, so they're dropped. */
export function toGridPhoto(photo: PhotoWithVersions): GridPhoto | null {
  const original = originalVersion(photo)
  if (!original?.width || !original?.height) return null
  return {
    id: photo.id,
    filename: photo.filename || '',
    caption: photo.caption,
    aspectRatio: original.width / original.height,
    src: buildPhotoPath(photo, 'tablet'),
    srcSet: buildPhotoSrcSet(photo),
  }
}

export function toGridPhotos(photos: PhotoWithVersions[]): GridPhoto[] {
  return photos.flatMap((photo) => toGridPhoto(photo) ?? [])
}

export function toCoverPhoto(
  photo: PhotoWithVersions | null | undefined,
): CoverPhoto | null {
  const src = buildPhotoPath(photo, 'mobile_sm')
  if (!photo || !src) return null
  return { src, srcSet: buildPhotoSrcSet(photo) }
}

export function toPhotoPageData(
  photo: PhotoWithVersions & { album: { title: string | null } | null },
): PhotoPageData {
  const original = originalVersion(photo) ?? photo.versions[0]
  const originalSrc = buildPhotoPath(photo, 'original')
  return {
    caption: photo.caption,
    albumTitle: photo.album?.title ?? null,
    src: buildPhotoPath(photo, 'desktop') || originalSrc,
    original: {
      src: originalSrc,
      width: original?.width ?? null,
      height: original?.height ?? null,
    },
  }
}
