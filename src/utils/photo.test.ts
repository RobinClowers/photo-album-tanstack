import { describe, expect, it } from 'vitest'
import type { PhotoVersion } from '@/db/schema'
import {
  BASE_PHOTO_PATH,
  buildPhotoPath,
  buildPhotoSrcSet,
  type PhotoWithVersions,
} from './photo'

function version(
  overrides: Partial<PhotoVersion> & Pick<PhotoVersion, 'size'>,
): PhotoVersion {
  return {
    id: 1,
    mimeType: 'image/jpeg',
    width: 100,
    height: 100,
    photoId: 1,
    createdAt: '',
    updatedAt: '',
    filename: 'IMG_1.jpg',
    ...overrides,
  }
}

function photo(versions: PhotoVersion[]): PhotoWithVersions {
  return {
    id: 1,
    filename: 'IMG_1.jpg',
    createdAt: null,
    updatedAt: null,
    path: 'bangkok',
    albumId: 1,
    caption: null,
    mimeType: 'image/jpeg',
    googleId: null,
    takenAt: null,
    width: 4000,
    height: 3000,
    cameraMake: null,
    cameraModel: null,
    focalLength: null,
    apertureFNumber: null,
    isoEquivalent: null,
    exposureTime: null,
    lat: null,
    lon: null,
    versions,
  }
}

describe('buildPhotoPath', () => {
  it('builds <base>/<album path>/<size>/<version filename>', () => {
    const p = photo([version({ size: 'tablet', filename: 'IMG_1.jpg' })])
    expect(buildPhotoPath(p, 'tablet')).toBe(
      `${BASE_PHOTO_PATH}bangkok/tablet/IMG_1.jpg`,
    )
  })

  it('returns an empty string when the photo has no versions', () => {
    expect(buildPhotoPath(photo([]), 'tablet')).toBe('')
    expect(buildPhotoPath(null, 'tablet')).toBe('')
  })
})

describe('buildPhotoSrcSet', () => {
  it('lists non-original versions ascending by width', () => {
    const p = photo([
      version({ size: 'desktop', width: 3072, filename: 'a.jpg' }),
      version({ size: 'original', width: 6000, filename: 'a.jpg' }),
      version({ size: 'mobile_sm', width: 640, filename: 'a.jpg' }),
    ])
    expect(buildPhotoSrcSet(p)).toBe(
      [
        `${BASE_PHOTO_PATH}bangkok/mobile_sm/a.jpg 640w`,
        `${BASE_PHOTO_PATH}bangkok/desktop/a.jpg 3072w`,
      ].join(', '),
    )
  })

  it('is undefined when only the original exists', () => {
    const p = photo([version({ size: 'original', width: 6000 })])
    expect(buildPhotoSrcSet(p)).toBeUndefined()
  })
})
