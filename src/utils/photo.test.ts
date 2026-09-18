import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PhotoVersion } from '@/db/schema'
import {
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

const DEFAULT_BASE = 'https://s3.amazonaws.com/robin-photos/'

describe('buildPhotoPath', () => {
  it('builds <base>/<album path>/<size>/<version filename>', () => {
    const p = photo([version({ size: 'tablet', filename: 'IMG_1_tablet.jpg' })])
    expect(buildPhotoPath(p, 'tablet')).toBe(
      'https://s3.amazonaws.com/robin-photos/bangkok/tablet/IMG_1_tablet.jpg',
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
      'https://s3.amazonaws.com/robin-photos/bangkok/mobile_sm/a.jpg 640w, ' +
        'https://s3.amazonaws.com/robin-photos/bangkok/desktop/a.jpg 3072w',
    )
  })

  it('is undefined when only the original exists', () => {
    const p = photo([version({ size: 'original', width: 6000 })])
    expect(buildPhotoSrcSet(p)).toBeUndefined()
  })
})

describe('BASE_PHOTO_PATH', () => {
  // The base URL is read once at module load, so each case needs a fresh
  // module instance: stubbing the env after a static import changes nothing.
  async function importWithBase(base?: string) {
    vi.resetModules()
    if (base === undefined) {
      vi.stubEnv('VITE_PHOTO_BASE_URL', '')
    } else {
      vi.stubEnv('VITE_PHOTO_BASE_URL', base)
    }
    return import('./photo')
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('falls back to the production bucket when unset', async () => {
    const { BASE_PHOTO_PATH } = await importWithBase()
    expect(BASE_PHOTO_PATH).toBe(DEFAULT_BASE)
  })

  it('uses VITE_PHOTO_BASE_URL when set', async () => {
    const { BASE_PHOTO_PATH, buildPhotoPath: build } = await importWithBase(
      'https://staging.example.com/photos/',
    )
    expect(BASE_PHOTO_PATH).toBe('https://staging.example.com/photos/')
    expect(build(photo([version({ size: 'tablet' })]), 'tablet')).toBe(
      'https://staging.example.com/photos/bangkok/tablet/IMG_1.jpg',
    )
  })

  it('adds a missing trailing slash', async () => {
    const { BASE_PHOTO_PATH, buildPhotoPath: build } = await importWithBase(
      'https://staging.example.com/photos',
    )
    expect(BASE_PHOTO_PATH).toBe('https://staging.example.com/photos/')
    expect(build(photo([version({ size: 'tablet' })]), 'tablet')).toBe(
      'https://staging.example.com/photos/bangkok/tablet/IMG_1.jpg',
    )
  })

  it('does not double a trailing slash', async () => {
    const { BASE_PHOTO_PATH } = await importWithBase(
      'https://staging.example.com/photos/',
    )
    expect(BASE_PHOTO_PATH).toBe('https://staging.example.com/photos/')
  })
})
