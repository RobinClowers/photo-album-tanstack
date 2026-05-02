import { eq, desc, sql } from 'drizzle-orm'
import { type DB } from './index'
import { albums, photos, type Album, type Photo, type NewAlbum, type NewPhoto } from './schema'

export async function getAlbums(db: DB): Promise<Album[]> {
  return await db.select().from(albums).orderBy(desc(albums.createdAt))
}

export async function getAlbum(db: DB, id: number): Promise<Album | undefined> {
  const [album] = await db.select().from(albums).where(eq(albums.id, id))
  return album
}

export async function getAlbumBySlug(db: DB, slug: string): Promise<Album | undefined> {
  const [album] = await db.select().from(albums).where(eq(albums.slug, slug))
  return album
}

export async function createAlbum(db: DB, data: NewAlbum): Promise<Album> {
  const [album] = await db.insert(albums).values(data).returning()
  return album
}

export async function updateAlbum(db: DB, id: number, data: Partial<NewAlbum>): Promise<Album | undefined> {
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

export async function createPhoto(db: DB, data: NewPhoto): Promise<Photo> {
  const [photo] = await db.insert(photos).values(data).returning()
  return photo
}

export async function updatePhoto(db: DB, id: number, data: Partial<NewPhoto>): Promise<Photo | undefined> {
  const [photo] = await db
    .update(photos)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(photos.id, id))
    .returning()
  return photo
}

export async function deletePhoto(db: DB, id: number): Promise<void> {
  await db.delete(photos).where(eq(photos.id, id))
}

export async function getAlbumsWithPhotoCount(db: DB): Promise<(Album & { photoCount: number })[]> {
  const result = await db
    .select({
      id: albums.id,
      title: albums.title,
      coverPhotoId: albums.coverPhotoId,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt,
      slug: albums.slug,
      publishedAt: albums.publishedAt,
      firstPhotoTakenAt: albums.firstPhotoTakenAt,
      photoCount: sql<number>`count(${photos.id})`,
    })
    .from(albums)
    .leftJoin(photos, eq(albums.id, photos.albumId))
    .groupBy(albums.id)
    .orderBy(desc(albums.createdAt))

  return result as (Album & { photoCount: number })[]
}

export async function getPhotosWithAlbum(db: DB, albumId?: number): Promise<(Photo & { album: Album | null })[]> {
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