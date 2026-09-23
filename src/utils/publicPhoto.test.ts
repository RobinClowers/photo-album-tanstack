import { describe, expect, it } from 'vitest'
import type { PhotoVersion } from '@/db/schema'
import type { PhotoWithVersions } from './photo'
import {
  toCoverPhoto,
  toGridPhoto,
  toGridPhotos,
  toPhotoPageData,
} from './publicPhoto'

function version(
  size: string,
  width: number | null,
  height: number | null,
): PhotoVersion {
  return {
    id: 1,
    size,
    mimeType: 'image/jpeg',
    width,
    height,
    photoId: 1,
    createdAt: '',
    updatedAt: '',
    filename: `IMG_1_${size}.jpg`,
  }
}

function photo(
  versions: PhotoVersion[],
  overrides: Partial<PhotoWithVersions> = {},
): PhotoWithVersions {
  return {
    id: 7,
    filename: 'IMG_1.jpg',
    createdAt: null,
    updatedAt: null,
    path: 'bangkok',
    albumId: 1,
    caption: 'Wat Arun',
    mimeType: 'image/jpeg',
    googleId: 'google-123',
    takenAt: null,
    width: 4000,
    height: 3000,
    cameraMake: 'Panasonic',
    cameraModel: 'DMC-GX1',
    focalLength: 20,
    apertureFNumber: 1.7,
    isoEquivalent: 200,
    exposureTime: '1/250',
    lat: '13.7437',
    lon: '100.4888',
    versions,
    ...overrides,
  }
}

const VERSIONS = [
  version('original', 4000, 3000),
  version('mobile_sm', 640, 480),
  version('tablet', 1536, 1152),
  version('desktop', 3072, 2304),
]

describe('toGridPhoto', () => {
  it('keeps only what the grid renders', () => {
    expect(toGridPhoto(photo(VERSIONS))).toEqual({
      id: 7,
      filename: 'IMG_1.jpg',
      caption: 'Wat Arun',
      aspectRatio: 4 / 3,
      src: 'https://img.robinclowers.com/bangkok/tablet/IMG_1_tablet.jpg',
      srcSet:
        'https://img.robinclowers.com/bangkok/mobile_sm/IMG_1_mobile_sm.jpg 640w, ' +
        'https://img.robinclowers.com/bangkok/tablet/IMG_1_tablet.jpg 1536w, ' +
        'https://img.robinclowers.com/bangkok/desktop/IMG_1_desktop.jpg 3072w',
    })
  })

  it('drops a photo whose original has no dimensions', () => {
    expect(toGridPhoto(photo([version('original', null, 3000)]))).toBeNull()
    expect(toGridPhoto(photo([version('tablet', 1536, 1152)]))).toBeNull()
  })
})

describe('toGridPhotos', () => {
  it('filters out photos that cannot be laid out', () => {
    const grid = toGridPhotos([
      photo(VERSIONS, { id: 1 }),
      photo([], { id: 2 }),
      photo(VERSIONS, { id: 3 }),
    ])
    expect(grid.map((p) => p.id)).toEqual([1, 3])
  })
})

describe('toCoverPhoto', () => {
  it('returns the small cover image and its srcset', () => {
    expect(toCoverPhoto(photo(VERSIONS))?.src).toBe(
      'https://img.robinclowers.com/bangkok/mobile_sm/IMG_1_mobile_sm.jpg',
    )
  })

  it('returns null without a cover photo or versions', () => {
    expect(toCoverPhoto(null)).toBeNull()
    expect(toCoverPhoto(photo([]))).toBeNull()
  })
})

describe('toPhotoPageData', () => {
  it('keeps the display and original images and drops EXIF and GPS', () => {
    const data = toPhotoPageData({
      ...photo(VERSIONS),
      album: { title: 'Bangkok' },
    })
    expect(data).toEqual({
      caption: 'Wat Arun',
      albumTitle: 'Bangkok',
      src: 'https://img.robinclowers.com/bangkok/desktop/IMG_1_desktop.jpg',
      original: {
        src: 'https://img.robinclowers.com/bangkok/original/IMG_1_original.jpg',
        width: 4000,
        height: 3000,
      },
    })
  })

  it('falls back to the original when there is no desktop version', () => {
    const data = toPhotoPageData({
      ...photo([version('original', 800, 600)]),
      album: null,
    })
    expect(data.src).toBe(
      'https://img.robinclowers.com/bangkok/original/IMG_1_original.jpg',
    )
    expect(data.albumTitle).toBeNull()
  })
})
