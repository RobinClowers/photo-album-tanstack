import type { AdminAlbumDetails, AdminAlbumRow } from '@/db/admin'
import type {
  AdminImportDetails,
  AdminImportRow,
  AlbumImportRow,
  ImportCounts,
} from '@/db/imports'

/*
 * Minimal admin loader rows for component and route tests. The Drizzle row
 * types carry every column; tests only fill in what the pages read.
 */

export const counts = (partial: Partial<ImportCounts> = {}): ImportCounts => ({
  total: 0,
  queued: 0,
  processing: 0,
  done: 0,
  failed: 0,
  ...partial,
})

const version = (size: string, filename: string) => ({
  id: 1,
  size,
  filename,
  width: 400,
  height: 300,
})

export function albumRow(partial: Record<string, unknown> = {}) {
  return {
    id: 7,
    title: 'Iceland',
    slug: 'iceland',
    publishedAt: null,
    coverPhotoId: 70,
    photoCount: 12,
    firstPhotoTakenAt: '2024-06-01 10:00:00',
    cover_photo: {
      id: 70,
      path: 'iceland',
      versions: [version('mobile_sm', 'falls.jpg')],
    },
    ...partial,
  } as unknown as AdminAlbumRow
}

export type Photo = AdminAlbumDetails['photos'][number]

export function photo(partial: Record<string, unknown> = {}) {
  return {
    id: 70,
    filename: 'falls.jpg',
    caption: null,
    path: 'iceland',
    versions: [version('mobile_sm', 'falls.jpg')],
    ...partial,
  } as unknown as Photo
}

export function albumDetails(partial: Record<string, unknown> = {}) {
  return {
    id: 7,
    title: 'Iceland',
    slug: 'iceland',
    publishedAt: null,
    coverPhotoId: 70,
    updatedAt: '2024-06-01T10:00:00.000Z',
    photos: [photo(), photo({ id: 71, filename: 'glacier.jpg' })],
    ...partial,
  } as unknown as AdminAlbumDetails
}

export function albumImport(partial: Record<string, unknown> = {}) {
  return {
    id: 5,
    albumId: 7,
    kind: 'reprocess',
    status: 'done',
    error: null,
    createdAt: '2024-06-02T08:30:00.000Z',
    finishedAt: '2024-06-02T08:35:00.000Z',
    counts: counts({ total: 2, done: 2 }),
    ...partial,
  } as unknown as AlbumImportRow
}

export function importRow(partial: Record<string, unknown> = {}) {
  return {
    ...albumImport(),
    album: { id: 7, title: 'Iceland', slug: 'iceland' },
    ...partial,
  } as unknown as AdminImportRow
}

export function importDetails(partial: Record<string, unknown> = {}) {
  return {
    ...importRow(),
    status: 'failed',
    error: 'Queue send failed',
    counts: counts({ total: 2, done: 1, failed: 1 }),
    items: [
      {
        id: 1,
        photoId: null,
        filename: 'b.jpg',
        status: 'failed',
        attempts: 3,
        lastError: 'Error: fetch failed',
        updatedAt: '2024-06-02T08:35:00.000Z',
      },
      {
        id: 2,
        photoId: 70,
        filename: 'a.jpg',
        status: 'done',
        attempts: 1,
        lastError: null,
        updatedAt: '2024-06-02T08:31:00.000Z',
      },
    ],
    ...partial,
  } as unknown as AdminImportDetails
}
