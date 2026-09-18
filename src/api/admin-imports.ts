import { env } from 'cloudflare:workers'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createDB } from '@/db'
import {
  createImport,
  getImportForAdmin,
  listImportsForAdmin,
  listImportsForAlbum,
  resetFailedImportItems,
} from '@/db/imports'
import { getAlbum, getPhoto } from '@/db/queries'
import { photos } from '@/db/schema'
import { serializeImportItemPayload } from '@/server/pipeline/items'
import { enqueueItems } from '@/server/pipeline/queue'
import { requireAdmin } from './auth'

const id = z.number().int().positive()
const db = () => createDB(env.photo_album)

function validate<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
}

/**
 * Queue a reprocess of the given photos as one import. Rows first, then
 * messages: if the send fails the sweeper picks the items up within the hour.
 */
async function startReprocess(
  albumId: number | null,
  userId: number,
  targets: { id: number; filename: string | null }[],
  force: boolean,
) {
  const { import: record, itemIds } = await createImport(
    db(),
    { albumId, kind: 'reprocess', createdByUserId: userId },
    targets.map((photo) => ({
      photoId: photo.id,
      filename: photo.filename,
      payload: serializeImportItemPayload({
        task: 'reprocess-photo',
        photoId: photo.id,
        force,
      }),
    })),
  )
  await enqueueItems(env.PHOTO_QUEUE, itemIds)
  return record
}

export const adminReprocessAlbum = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(
      z.object({ albumId: id, force: z.boolean().default(false) }),
      input,
    ),
  )
  .handler(async ({ data, context }) => {
    const album = await getAlbum(db(), data.albumId)
    if (!album) throw new Error('Album not found')
    const targets = await db()
      .select({ id: photos.id, filename: photos.filename })
      .from(photos)
      .where(eq(photos.albumId, album.id))
    if (targets.length === 0) throw new Error('This album has no photos')
    return startReprocess(album.id, context.user.id, targets, data.force)
  })

export const adminReprocessPhoto = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(
      z.object({ photoId: id, force: z.boolean().default(true) }),
      input,
    ),
  )
  .handler(async ({ data, context }) => {
    const photo = await getPhoto(db(), data.photoId)
    if (!photo) throw new Error('Photo not found')
    return startReprocess(
      photo.albumId,
      context.user.id,
      [{ id: photo.id, filename: photo.filename }],
      data.force,
    )
  })

export const adminListImports = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .handler(async () => listImportsForAdmin(db()))

export const adminGetImport = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => validate(z.object({ id }), input))
  .handler(async ({ data }) => (await getImportForAdmin(db(), data.id)) ?? null)

export const adminListAlbumImports = createServerFn({ method: 'GET' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    validate(z.object({ albumId: id }), input),
  )
  .handler(async ({ data }) => listImportsForAlbum(db(), data.albumId))

export const adminRetryImport = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => validate(z.object({ id }), input))
  .handler(async ({ data }) => {
    const record = await getImportForAdmin(db(), data.id)
    if (!record) throw new Error('Import not found')
    const itemIds = await resetFailedImportItems(db(), data.id)
    if (itemIds.length === 0) throw new Error('Nothing to retry')
    await enqueueItems(env.PHOTO_QUEUE, itemIds)
    return { retried: itemIds.length }
  })
