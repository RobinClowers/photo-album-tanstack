import { createServerFn } from '@tanstack/react-start'
import { createDB } from '@/db'
import {
  getAlbumsWithCoverPhoto,
  getPhotosWithAlbum,
  getAlbumDetails as getAlbumDetailsQuery,
} from '@/db/queries'
import { env } from 'cloudflare:workers'

export const getAllAlbums = createServerFn({
  method: 'GET',
}).handler(async () => {
  const db = createDB(env.photo_album)
  return await getAlbumsWithCoverPhoto(db)
})

export const getAllPhotos = createServerFn({
  method: 'GET',
}).handler(async () => {
  const db = createDB(env.photo_album)
  return await getPhotosWithAlbum(db)
})

export const getPhotosByAlbumId = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { albumId: string }) => data)
  .handler(async ({ data }) => {
    const db = createDB(env.photo_album)
    const albumId = Number(data.albumId) || 0
    return await getPhotosWithAlbum(db, albumId)
  })

export const getAlbumDetails = createServerFn({
  method: 'GET',
})
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const db = createDB(env.photo_album)
    return await getAlbumDetailsQuery(db, data.slug)
  })
