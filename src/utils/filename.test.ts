import { describe, expect, it } from 'vitest'
import {
  isSupportedPhotoFilename,
  scrubFilename,
  variantFilename,
} from './filename'

describe('scrubFilename', () => {
  // Same fixture as the Rails FilenameScrubber spec.
  it('replaces every dot except the extension dot with a dash', () => {
    expect(scrubFilename('PANO_20181218_104720.vr~2.wat.jpg')).toBe(
      'PANO_20181218_104720-vr~2-wat.jpg',
    )
  })

  it('leaves a plain filename alone', () => {
    expect(scrubFilename('IMG_0001.JPG')).toBe('IMG_0001.JPG')
  })

  it('leaves a filename with no extension alone', () => {
    expect(scrubFilename('IMG_0001')).toBe('IMG_0001')
  })

  it('is idempotent', () => {
    const once = scrubFilename('a.b.c.jpg')
    expect(once).toBe('a-b-c.jpg')
    expect(scrubFilename(once)).toBe(once)
  })
})

describe('variantFilename', () => {
  it('swaps the extension for .jpg', () => {
    expect(variantFilename('P1040448.JPG')).toBe('P1040448.jpg')
    expect(variantFilename('screenshot.png')).toBe('screenshot.jpg')
  })

  it('keeps an already scrubbed basename intact', () => {
    expect(variantFilename('PANO-vr~2.jpg')).toBe('PANO-vr~2.jpg')
  })

  it('appends .jpg when there is no extension', () => {
    expect(variantFilename('noext')).toBe('noext.jpg')
  })

  it('does not treat a leading dot as an extension', () => {
    expect(variantFilename('.hidden')).toBe('.hidden.jpg')
  })
})

describe('isSupportedPhotoFilename', () => {
  it('accepts jpeg and png in any case', () => {
    expect(isSupportedPhotoFilename('a.jpg')).toBe(true)
    expect(isSupportedPhotoFilename('a.JPEG')).toBe(true)
    expect(isSupportedPhotoFilename('a.Png')).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isSupportedPhotoFilename('a.heic')).toBe(false)
    expect(isSupportedPhotoFilename('a.mp4')).toBe(false)
    expect(isSupportedPhotoFilename('jpg')).toBe(false)
  })
})
