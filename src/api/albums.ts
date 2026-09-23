import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { createDB } from '@/db'
import {
  getAlbumDetails as getAlbumDetailsQuery,
  getAlbumsWithCoverPhoto,
} from '@/db/queries'
import { getCurrentAdmin } from '@/server/auth'
import {
  toCoverPhoto,
  toGridPhotos,
  toPhotoPageData,
} from '@/utils/publicPhoto'

/**
 * Unpublished albums are drafts, reachable by URL only for the signed-in
 * admin (so they can preview before publishing). Cheap for anonymous
 * visitors: `getCurrentAdmin` returns early when there is no session cookie.
 */
async function canSeeUnpublished() {
  return (await getCurrentAdmin()) !== null
}

export const getAllAlbums = createServerFn({
  method: 'GET',
}).handler(async () => {
  const db = createDB(env.photo_album)
  const albums = await getAlbumsWithCoverPhoto(db)
  return albums.map((album) => ({
    id: album.id,
    slug: album.slug || '',
    title: album.title || '',
    cover_photo: toCoverPhoto(album.cover_photo),
  }))
})

export const getAlbumDetails = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const db = createDB(env.photo_album)
    const album = await getAlbumDetailsQuery(
      db,
      data.slug,
      await canSeeUnpublished(),
    )
    if (!album) return null
    return {
      title: album.title || '',
      slug: album.slug || '',
      photos: toGridPhotos(album.photos),
    }
  })

export const getPhotoDetailsFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { slug: string; filename: string }) => data)
  .handler(async ({ data }) => {
    const db = createDB(env.photo_album)
    const { getPhotoBySlugAndFilename } = await import('@/db/queries')
    const result = await getPhotoBySlugAndFilename(
      db,
      data.slug,
      data.filename,
      await canSeeUnpublished(),
    )
    if (!result) return null
    return { ...result, photo: toPhotoPageData(result.photo) }
  })
