import { and, desc, eq, isNotNull } from 'drizzle-orm'
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
        orderBy: (photos) => [photos.takenAt],
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
    orderBy: (photos, { desc }) => [desc(photos.takenAt)],
    columns: { filename: true },
  })

  const currentIndex = allPhotos.findIndex((p) => p.filename === filename)
  let previousPhotoFilename = null
  let nextPhotoFilename = null

  if (currentIndex > 0) {
    previousPhotoFilename = allPhotos[currentIndex - 1]?.filename ?? null
  }
  if (currentIndex !== -1 && currentIndex < allPhotos.length - 1) {
    nextPhotoFilename = allPhotos[currentIndex + 1]?.filename ?? null
  }

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

export async function getPhotosWithAlbum(
  db: DB,
  albumId?: number,
): Promise<(Photo & { album: Album | null })[]> {
  const query = db
    .select({
      id: photos.id,
      filename: photos.filename,
      createdAt: photos.createdAt,
      updatedAt: photos.updatedAt,
      path: photos.path,
      albumId: photos.albumId,
      caption: photos.caption,
      mimeType: photos.mimeType,
      googleId: photos.googleId,
      takenAt: photos.takenAt,
      width: photos.width,
      height: photos.height,
      cameraMake: photos.cameraMake,
      cameraModel: photos.cameraModel,
      focalLength: photos.focalLength,
      apertureFNumber: photos.apertureFNumber,
      isoEquivalent: photos.isoEquivalent,
      exposureTime: photos.exposureTime,
      lat: photos.lat,
      lon: photos.lon,
      album: albums,
    })
    .from(photos)
    .leftJoin(albums, eq(photos.albumId, albums.id))
    .orderBy(desc(photos.takenAt))

  if (albumId) {
    query.where(eq(photos.albumId, albumId))
  }

  return await query
}
