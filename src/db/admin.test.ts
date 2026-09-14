import { describe, expect, it } from 'vitest'
import { summarizeAlbumPhotos } from './admin'

describe('summarizeAlbumPhotos', () => {
  it('picks the earliest photo as the cover', () => {
    expect(
      summarizeAlbumPhotos([
        { id: 2, takenAt: '2019-07-04 12:00:00', filename: 'b.jpg' },
        { id: 1, takenAt: '2019-07-02 08:00:00', filename: 'a.jpg' },
      ]),
    ).toEqual({ coverPhotoId: 1, firstPhotoTakenAt: '2019-07-02 08:00:00' })
  })

  it('prefers a dated photo over one with no taken_at', () => {
    expect(
      summarizeAlbumPhotos([
        { id: 1, takenAt: null, filename: 'a.jpg' },
        { id: 2, takenAt: '2019-07-04 12:00:00', filename: 'b.jpg' },
      ]),
    ).toEqual({ coverPhotoId: 2, firstPhotoTakenAt: '2019-07-04 12:00:00' })
  })

  it('falls back to filename order when nothing has a date', () => {
    expect(
      summarizeAlbumPhotos([
        { id: 2, takenAt: null, filename: 'b.jpg' },
        { id: 1, takenAt: null, filename: 'a.jpg' },
      ]),
    ).toEqual({ coverPhotoId: 1, firstPhotoTakenAt: null })
  })

  it('reports no cover when the album is empty', () => {
    expect(summarizeAlbumPhotos([])).toEqual({
      coverPhotoId: null,
      firstPhotoTakenAt: null,
    })
  })

  it('does not mutate the input', () => {
    const photos = [
      { id: 2, takenAt: '2019-07-04 12:00:00', filename: 'b.jpg' },
      { id: 1, takenAt: '2019-07-02 08:00:00', filename: 'a.jpg' },
    ]
    summarizeAlbumPhotos(photos)
    expect(photos[0]?.id).toBe(2)
  })
})
