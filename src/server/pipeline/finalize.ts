import { eq } from 'drizzle-orm'
import type { DB } from '@/db'
import { summarizeAlbumPhotos } from '@/db/admin'
import { albums, photos } from '@/db/schema'

/**
 * Album bookkeeping once an import finishes: first_photo_taken_at becomes
 * the earliest photo (the Rails importer stored the latest, which sorted
 * albums wrongly on the index) and an album with no cover gets the earliest
 * photo as its default. The published state is left alone.
 */
export async function finalizeAlbum(db: DB, albumId: number): Promise<void> {
  const [album] = await db
    .select({ coverPhotoId: albums.coverPhotoId })
    .from(albums)
    .where(eq(albums.id, albumId))
  if (!album) return
  const rows = await db
    .select({
      id: photos.id,
      takenAt: photos.takenAt,
      filename: photos.filename,
    })
    .from(photos)
    .where(eq(photos.albumId, albumId))
  const summary = summarizeAlbumPhotos(rows)
  await db
    .update(albums)
    .set({
      firstPhotoTakenAt: summary.firstPhotoTakenAt,
      coverPhotoId: album.coverPhotoId ?? summary.coverPhotoId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(albums.id, albumId))
}
