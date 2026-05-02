import { createServerFn } from '@tanstack/react-start'
import { createDB } from '@/db'
import { getAlbumsWithPhotoCount, getPhotosWithAlbum } from '@/db/queries'

export const getAllAlbums = createServerFn({
  method: 'GET',
}).handler(async () => {
  const env = process.env as any
  const db = createDB(env.photo_album)
  return await getAlbumsWithPhotoCount(db)
})

export const getAllPhotos = createServerFn({
  method: 'GET',
}).handler(async () => {
  const env = process.env as any
  const db = createDB(env.photo_album)
  return await getPhotosWithAlbum(db)
})

export const getPhotosByAlbumId = createServerFn({
  method: 'GET',
}).handler(async (ctx: any) => {
  const env = process.env as any
  const db = createDB(env.photo_album)
  const albumId = Number(ctx.data?.albumId) || 0
  return await getPhotosWithAlbum(db, albumId)
})