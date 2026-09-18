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
import { uniqueConstraintColumns } from '@/db/errors'
import {
  createAlbum,
  getPhoto,
  getPhotoWithVersions,
  updateAlbum,
  updatePhoto,
} from '@/db/queries'
import { getStorage, photoObjectKeys } from '@/server/storage'
import { CAPTION_MAX_LENGTH } from '@/utils/photo'
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

/**
 * Validation failures end up in a Snackbar, and `ZodError.message` is a JSON
 * dump of every issue, so surface just the first message.
 */
function validate<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
}

const slugTaken = (value: string) =>
  new Error(`An album with slug "${value}" already exists`)

/**
 * `isSlugTaken` is only a fast path: albums.slug is unique in the database, so
 * a concurrent create or rename can still collide. (albums.title is unique
 * too, inherited from the Rails schema.)
 */
async function withConstraintErrors<T>(
  value: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const columns = uniqueConstraintColumns(err)
    if (columns === 'albums.slug') throw slugTaken(value)
    if (columns === 'albums.title') {
      throw new Error('An album with that title already exists')
    }
    throw err
  }
}

export const adminListAlbums = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => listAlbumsForAdmin(db()))

export const adminGetAlbum = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => validate(z.object({ id }), input))
  .handler(async ({ data }) => (await getAlbumForAdmin(db(), data.id)) ?? null)

export const adminCreateAlbum = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ title, slug }), input),
  )
  .handler(async ({ data }) => {
    if (await isSlugTaken(db(), data.slug)) throw slugTaken(data.slug)
    const now = new Date().toISOString()
    return withConstraintErrors(data.slug, () =>
      createAlbum(db(), {
        title: data.title,
        slug: data.slug,
        createdAt: now,
        updatedAt: now,
      }),
    )
  })

export const adminUpdateAlbum = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ id, title, slug }), input),
  )
  .handler(async ({ data }) => {
    if (await isSlugTaken(db(), data.slug, data.id)) throw slugTaken(data.slug)
    const album = await withConstraintErrors(data.slug, () =>
      updateAlbum(db(), data.id, { title: data.title, slug: data.slug }),
    )
    if (!album) throw new Error('Album not found')
    return album
  })

export const adminSetAlbumPublished = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ id, published: z.boolean() }), input),
  )
  .handler(async ({ data }) => {
    const result = await setAlbumPublished(db(), data.id, data.published)
    if (!result.ok) {
      throw new Error(
        result.reason === 'no-cover'
          ? 'Choose a cover photo before publishing'
          : 'Album not found',
      )
    }
    return result.album
  })

export const adminSetCoverPhoto = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ albumId: id, photoId: id }), input),
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
    validate(
      z.object({
        photoId: id,
        caption: z.string().trim().max(CAPTION_MAX_LENGTH),
      }),
      input,
    ),
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
  .inputValidator((input: unknown) =>
    validate(z.object({ photoId: id }), input),
  )
  .handler(async ({ data }) => {
    const photo = await getPhotoWithVersions(db(), data.photoId)
    if (!photo) throw new Error('Photo not found')
    // Storage first: DeleteObjects is idempotent, so if it fails the rows
    // stay and the admin can simply retry, whereas deleting the rows first
    // would strand the objects in the bucket with nothing pointing at them.
    const keys = photoObjectKeys(photo, photo.versions)
    if (keys.length) await getStorage().deleteObjects(keys)
    await deletePhotoRecord(db(), data.photoId)
    return { deleted: photo.id }
  })
