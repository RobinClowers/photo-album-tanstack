import { describe, expect, it } from 'vitest'
import type { PickedMediaItem } from '@/server/google-photos'
import {
  exposureSecondsFrom,
  pickedItemToPayload,
  planPickedItems,
  takenAtFromCreateTime,
} from './google-plan'

function picked(
  id: string,
  filename: string,
  overrides: Partial<PickedMediaItem> = {},
): PickedMediaItem {
  return {
    id,
    createTime: '2018-07-03T10:31:30Z',
    type: 'PHOTO',
    mediaFile: {
      baseUrl: `https://lh3.googleusercontent.com/${id}`,
      mimeType: 'image/jpeg',
      filename,
      mediaFileMetadata: {
        width: 4032,
        height: 3024,
        cameraMake: 'Google',
        cameraModel: 'Pixel 2',
        photoMetadata: {
          focalLength: 4.442,
          apertureFNumber: 1.8,
          isoEquivalent: 58,
          exposureTime: '0.000214s',
        },
      },
    },
    ...overrides,
  }
}

describe('pickedItemToPayload', () => {
  it('flattens metadata and scrubs the filename', () => {
    expect(pickedItemToPayload(picked('g1', 'PANO.vr~2.jpg'))).toEqual({
      id: 'g1',
      baseUrl: 'https://lh3.googleusercontent.com/g1',
      filename: 'PANO-vr~2.jpg',
      mimeType: 'image/jpeg',
      createTime: '2018-07-03T10:31:30Z',
      width: 4032,
      height: 3024,
      cameraMake: 'Google',
      cameraModel: 'Pixel 2',
      focalLength: 4.442,
      apertureFNumber: 1.8,
      isoEquivalent: 58,
      exposureSeconds: 0.000214,
    })
  })

  it('tolerates missing metadata', () => {
    const item = picked('g2', 'a.JPG')
    item.mediaFile = { ...item.mediaFile, mimeType: 'image/JPEG' }
    delete item.mediaFile.mediaFileMetadata
    const payload = pickedItemToPayload(item)
    expect(payload.width).toBeNull()
    expect(payload.cameraMake).toBeNull()
    expect(payload.exposureSeconds).toBeNull()
    expect(payload.mimeType).toBe('image/jpeg')
  })
})

describe('exposureSecondsFrom / takenAtFromCreateTime', () => {
  it('parses Google duration strings', () => {
    expect(exposureSecondsFrom('0.001s')).toBe(0.001)
    expect(exposureSecondsFrom('2s')).toBe(2)
    expect(exposureSecondsFrom('fast')).toBeNull()
    expect(exposureSecondsFrom(undefined)).toBeNull()
  })

  it('formats createTime the way the photos table stores taken_at', () => {
    expect(takenAtFromCreateTime('2018-07-03T10:31:30Z')).toBe(
      '2018-07-03 10:31:30',
    )
    expect(takenAtFromCreateTime('2018-07-03T10:31:30.123456Z')).toBe(
      '2018-07-03 10:31:30',
    )
    expect(takenAtFromCreateTime('nope')).toBeNull()
  })
})

describe('planPickedItems', () => {
  it('skips existing photos by id, then by filename, and unsupported items', () => {
    const items = [
      picked('g1', 'a.jpg'),
      picked('g2', 'b.jpg'),
      picked('g3', 'c.jpg'),
      picked('g4', 'movie.mp4', { type: 'VIDEO' }),
      picked('g5', 'c.jpg'),
    ]
    const plan = planPickedItems(items, [
      { googleId: 'g1', filename: 'renamed.jpg' },
      { googleId: null, filename: 'b.jpg' },
    ])
    expect(plan.toImport.map((p) => p.id)).toEqual(['g3'])
    expect(plan.skipped).toEqual({
      existingById: 1,
      existingByFilename: 1,
      unsupported: 1,
      duplicateFilename: 1,
    })
  })

  it('imports everything into an empty album', () => {
    const plan = planPickedItems(
      [picked('g1', 'a.jpg'), picked('g2', 'b.jpg')],
      [],
    )
    expect(plan.toImport).toHaveLength(2)
  })
})
