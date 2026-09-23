import { and, asc, desc, eq, isNotNull } from 'drizzle-orm'
import type { DB } from './index'
import {
  type Album,
  albums,
  type NewAlbum,
  type NewPhoto,
  type Photo,
  photos,
} from './schema'

export async function getAlbumsWithCoverPhoto(db: DB) {
  return db.query.albums.findMany({
    with: {
      cover_photo: {
        with: {
          versions: true,
        },
      },
    },
    where: isNotNull(albums.publishedAt),
    orderBy: [desc(albums.firstPhotoTakenAt)],
  })
}

export async function getAlbum(db: DB, id: number): Promise<Album | undefined> {
  const [album] = await db.select().from(albums).where(eq(albums.id, id))
  return album
}

/**
 * Unpublished albums are drafts: only the admin may see them, so every
 * public lookup by slug has to filter on published_at.
 */
function bySlug(slug: string, includeUnpublished: boolean) {
  return includeUnpublished
    ? eq(albums.slug, slug)
    : and(eq(albums.slug, slug), isNotNull(albums.publishedAt))
}

export async function getAlbumBySlug(
  db: DB,
  slug: string,
  includeUnpublished = false,
): Promise<Album | undefined> {
  const [album] = await db
    .select()
    .from(albums)
    .where(bySlug(slug, includeUnpublished))
  return album
}

/**
 * The order photos appear in an album. The album grid and the photo page's
 * previous/next links must both use it, or navigation drifts from the grid.
 * id breaks ties so photos sharing (or missing) takenAt keep a stable order.
 */
function albumPhotoOrder(p: typeof photos._.columns) {
  return [asc(p.takenAt), asc(p.id)]
}

export async function getAlbumDetails(
  db: DB,
  slug: string,
  includeUnpublished = false,
) {
  return db.query.albums.findFirst({
    where: bySlug(slug, includeUnpublished),
    with: {
      cover_photo: {
        with: {
          versions: true,
        },
      },
      photos: {
        with: {
          versions: true,
        },
        orderBy: albumPhotoOrder,
      },
    },
  })
}

export async function getPhotoBySlugAndFilename(
  db: DB,
  slug: string,
  filename: string,
  includeUnpublished = false,
) {
  const album = await getAlbumBySlug(db, slug, includeUnpublished)
  if (!album) return null

  const photo = await db.query.photos.findFirst({
    where: (photos, { and, eq }) =>
      and(eq(photos.albumId, album.id), eq(photos.filename, filename)),
    with: {
      album: true,
      versions: true,
    },
  })

  if (!photo) return null

  const allPhotos = await db.query.photos.findMany({
    where: eq(photos.albumId, album.id),
    orderBy: albumPhotoOrder,
    columns: { id: true, filename: true },
  })

  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id)
  const previousPhotoFilename =
    currentIndex > 0 ? (allPhotos[currentIndex - 1]?.filename ?? null) : null
  const nextPhotoFilename =
    currentIndex !== -1 ? (allPhotos[currentIndex + 1]?.filename ?? null) : null

  return { photo, previousPhotoFilename, nextPhotoFilename }
}

export async function createAlbum(db: DB, data: NewAlbum): Promise<Album> {
  const [album] = await db.insert(albums).values(data).returning()
  if (!album) throw new Error('Failed to create album')
  return album
}

export async function updateAlbum(
  db: DB,
  id: number,
  data: Partial<NewAlbum>,
): Promise<Album | undefined> {
  const [album] = await db
    .update(albums)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(albums.id, id))
    .returning()
  return album
}

export async function deleteAlbum(db: DB, id: number): Promise<void> {
  await db.delete(albums).where(eq(albums.id, id))
}

export async function getPhotos(db: DB, albumId?: number): Promise<Photo[]> {
  if (albumId) {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.albumId, albumId))
      .orderBy(desc(photos.takenAt))
  }
  return await db.select().from(photos).orderBy(desc(photos.takenAt))
}

export async function getPhoto(db: DB, id: number): Promise<Photo | undefined> {
  const [photo] = await db.select().from(photos).where(eq(photos.id, id))
  return photo
}

export async function getPhotoWithVersions(db: DB, id: number) {
  return db.query.photos.findFirst({
    where: eq(photos.id, id),
    with: { versions: true },
  })
}

export async function createPhoto(db: DB, data: NewPhoto): Promise<Photo> {
  const [photo] = await db.insert(photos).values(data).returning()
  if (!photo) throw new Error('Failed to create photo')
  return photo
}

export async function updatePhoto(
  db: DB,
  id: number,
  data: Partial<NewPhoto>,
): Promise<Photo | undefined> {
  const [photo] = await db
    .update(photos)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(photos.id, id))
    .returning()
  return photo
}
