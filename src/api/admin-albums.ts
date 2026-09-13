import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createDB } from '@/db'
import {
  deletePhotoRecord,
  getAlbumForAdmin,
  isSlugTaken,
  listAlbumsForAdmin,
  setAlbumPublished,
} from '@/db/admin'
import { createAlbum, getPhoto, updateAlbum, updatePhoto } from '@/db/queries'
import { SLUG_PATTERN } from '@/utils/slug'
import { requireAdmin } from './auth'

const id = z.number().int().positive()
const title = z.string().trim().min(1, 'Title is required').max(200)
const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(200)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and dashes')

const db = () => createDB(env.photo_album)

export const adminListAlbums = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => listAlbumsForAdmin(db()))

export const adminGetAlbum = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ id }).parse(input))
  .handler(async ({ data }) => (await getAlbumForAdmin(db(), data.id)) ?? null)

export const adminCreateAlbum = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ title, slug }).parse(input))
  .handler(async ({ data }) => {
    if (await isSlugTaken(db(), data.slug)) {
      throw new Error(`An album with slug "${data.slug}" already exists`)
    }
    const now = new Date().toISOString()
    return createAlbum(db(), {
      title: data.title,
      slug: data.slug,
      createdAt: now,
      updatedAt: now,
    })
  })

export const adminUpdateAlbum = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({ id, title, slug }).parse(input),
  )
  .handler(async ({ data }) => {
    if (await isSlugTaken(db(), data.slug, data.id)) {
      throw new Error(`An album with slug "${data.slug}" already exists`)
    }
    const album = await updateAlbum(db(), data.id, {
      title: data.title,
      slug: data.slug,
    })
    if (!album) throw new Error('Album not found')
    return album
  })

export const adminSetAlbumPublished = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({ id, published: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const album = await setAlbumPublished(db(), data.id, data.published)
    if (!album) throw new Error('Album not found')
    return album
  })

export const adminSetCoverPhoto = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({ albumId: id, photoId: id }).parse(input),
  )
  .handler(async ({ data }) => {
    const photo = await getPhoto(db(), data.photoId)
    if (!photo || photo.albumId !== data.albumId) {
      throw new Error('Photo does not belong to this album')
    }
    const album = await updateAlbum(db(), data.albumId, {
      coverPhotoId: data.photoId,
    })
    if (!album) throw new Error('Album not found')
    return album
  })

export const adminUpdatePhotoCaption = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z
      .object({ photoId: id, caption: z.string().trim().max(2000) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const photo = await updatePhoto(db(), data.photoId, {
      caption: data.caption || null,
    })
    if (!photo) throw new Error('Photo not found')
    return photo
  })

export const adminDeletePhoto = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => z.object({ photoId: id }).parse(input))
  .handler(async ({ data }) => {
    const photo = await deletePhotoRecord(db(), data.photoId)
    if (!photo) throw new Error('Photo not found')
    // TODO(PR 3): delete the S3 objects for this photo's versions.
    return { deleted: photo.id }
  })
