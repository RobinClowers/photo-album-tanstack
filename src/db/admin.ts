import { and, count, desc, eq, isNotNull, ne, sql } from 'drizzle-orm'
import type { DB } from './index'
import {
  type Album,
  albums,
  comments,
  photos,
  photoVersions,
  plusOnes,
} from './schema'

/** All albums (published or not) with cover photo and photo count. */
export async function listAlbumsForAdmin(db: DB) {
  const rows = await db.query.albums.findMany({
    with: { cover_photo: { with: { versions: true } } },
    // Albums without photos yet have a null first_photo_taken_at, which
    // SQLite sorts last in DESC; fall back to created_at so a brand new
    // album shows up at the top of the Unpublished table.
    orderBy: [
      desc(sql`coalesce(${albums.firstPhotoTakenAt}, ${albums.createdAt})`),
      desc(albums.createdAt),
    ],
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

export type SetPublishedResult =
  | { ok: true; album: Album }
  | { ok: false; reason: 'not-found' | 'no-cover' }

/**
 * Publish or unpublish an album. Publishing requires a cover photo: the
 * public index renders a blank card without one, and the disabled buttons in
 * the UI are not a guarantee (stale tab, second window).
 */
export async function setAlbumPublished(
  db: DB,
  id: number,
  published: boolean,
): Promise<SetPublishedResult> {
  const now = new Date().toISOString()
  const where = published
    ? and(eq(albums.id, id), isNotNull(albums.coverPhotoId))
    : eq(albums.id, id)
  const [album] = await db
    .update(albums)
    .set({ publishedAt: published ? now : null, updatedAt: now })
    .where(where)
    .returning()
  if (album) return { ok: true, album }

  // Only reached on failure, so the extra read costs nothing in the happy path.
  const [existing] = await db
    .select({ id: albums.id })
    .from(albums)
    .where(eq(albums.id, id))
  return { ok: false, reason: existing ? 'no-cover' : 'not-found' }
}

type PhotoOrderFields = {
  id: number
  takenAt: string | null
  filename: string | null
}

/**
 * Cover photo and first_photo_taken_at for an album, given the photos it has
 * left. Earliest photo wins; photos with no taken_at sort last so a dated
 * photo is always preferred as the cover.
 */
export function summarizeAlbumPhotos(remaining: PhotoOrderFields[]) {
  const sorted = [...remaining].sort((a, b) => {
    if (a.takenAt !== b.takenAt) {
      if (a.takenAt === null) return 1
      if (b.takenAt === null) return -1
      return a.takenAt < b.takenAt ? -1 : 1
    }
    return (a.filename ?? '').localeCompare(b.filename ?? '')
  })
  const first = sorted[0]
  return {
    coverPhotoId: first?.id ?? null,
    firstPhotoTakenAt: first?.takenAt ?? null,
  }
}

/**
 * Delete a photo, its version rows and the comments/plus_ones that reference
 * it (the schema has no foreign keys, so nothing cascades), then fix up the
 * album: reassign the cover if this photo was it, recompute
 * first_photo_taken_at and bump updated_at. An album left without a cover is
 * unpublished, since a published album must have one.
 *
 * All writes go through `db.batch` so a failure part way through cannot leave
 * orphans; D1 does not support `db.transaction`. Storage objects are handled
 * by the caller.
 */
export async function deletePhotoRecord(db: DB, photoId: number) {
  const [photo] = await db.select().from(photos).where(eq(photos.id, photoId))
  if (!photo) return undefined

  const deletes = [
    db.delete(photoVersions).where(eq(photoVersions.photoId, photoId)),
    db.delete(comments).where(eq(comments.photoId, photoId)),
    db.delete(plusOnes).where(eq(plusOnes.photoId, photoId)),
    db.delete(photos).where(eq(photos.id, photoId)),
  ] as const

  const albumId = photo.albumId
  if (albumId === null) {
    await db.batch([...deletes])
    return photo
  }

  const [album] = await db
    .select({ coverPhotoId: albums.coverPhotoId })
    .from(albums)
    .where(eq(albums.id, albumId))
  const remaining = await db
    .select({
      id: photos.id,
      takenAt: photos.takenAt,
      filename: photos.filename,
    })
    .from(photos)
    .where(and(eq(photos.albumId, albumId), ne(photos.id, photoId)))

  const summary = summarizeAlbumPhotos(remaining)
  const wasCover = album?.coverPhotoId === photoId
  const coverPhotoId = wasCover
    ? summary.coverPhotoId
    : (album?.coverPhotoId ?? null)

  await db.batch([
    ...deletes,
    db
      .update(albums)
      .set({
        coverPhotoId,
        firstPhotoTakenAt: summary.firstPhotoTakenAt,
        updatedAt: new Date().toISOString(),
        // A published album without a cover renders a blank card.
        ...(coverPhotoId === null ? { publishedAt: null } : {}),
      })
      .where(eq(albums.id, albumId)),
  ])
  return photo
}
