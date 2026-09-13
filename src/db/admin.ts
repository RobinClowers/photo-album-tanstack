import { and, count, desc, eq, ne } from 'drizzle-orm'
import type { DB } from './index'
import { albums, photos, photoVersions } from './schema'

/** All albums (published or not) with cover photo and photo count. */
export async function listAlbumsForAdmin(db: DB) {
  const rows = await db.query.albums.findMany({
    with: { cover_photo: { with: { versions: true } } },
    orderBy: [desc(albums.firstPhotoTakenAt), desc(albums.createdAt)],
  })
  const counts = await db
    .select({ albumId: photos.albumId, photoCount: count() })
    .from(photos)
    .groupBy(photos.albumId)
  const countByAlbum = new Map(counts.map((c) => [c.albumId, c.photoCount]))
  return rows.map((album) => ({
    ...album,
    photoCount: countByAlbum.get(album.id) ?? 0,
  }))
}

export type AdminAlbumRow = Awaited<
  ReturnType<typeof listAlbumsForAdmin>
>[number]

export async function getAlbumForAdmin(db: DB, id: number) {
  return db.query.albums.findFirst({
    where: eq(albums.id, id),
    with: {
      cover_photo: { with: { versions: true } },
      photos: {
        with: { versions: true },
        orderBy: (p) => [p.takenAt, p.filename],
      },
    },
  })
}

export type AdminAlbumDetails = NonNullable<
  Awaited<ReturnType<typeof getAlbumForAdmin>>
>

export async function isSlugTaken(
  db: DB,
  slug: string,
  excludeAlbumId?: number,
): Promise<boolean> {
  const where =
    excludeAlbumId === undefined
      ? eq(albums.slug, slug)
      : and(eq(albums.slug, slug), ne(albums.id, excludeAlbumId))
  const [row] = await db.select({ id: albums.id }).from(albums).where(where)
  return Boolean(row)
}

export async function setAlbumPublished(
  db: DB,
  id: number,
  published: boolean,
) {
  const now = new Date().toISOString()
  const [album] = await db
    .update(albums)
    .set({ publishedAt: published ? now : null, updatedAt: now })
    .where(eq(albums.id, id))
    .returning()
  return album
}

/**
 * Delete a photo and its version rows, clearing the album cover if this
 * photo was it. Storage objects are handled by the caller.
 */
export async function deletePhotoRecord(db: DB, photoId: number) {
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId))
  if (!photo) return undefined
  if (photo.albumId) {
    await db
      .update(albums)
      .set({ coverPhotoId: null })
      .where(
        and(eq(albums.id, photo.albumId), eq(albums.coverPhotoId, photoId)),
      )
  }
  await db.delete(photoVersions).where(eq(photoVersions.photoId, photoId))
  await db.delete(photos).where(eq(photos.id, photoId))
  return photo
}
