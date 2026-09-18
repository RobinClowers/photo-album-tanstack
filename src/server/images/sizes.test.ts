import { describe, expect, it } from 'vitest'
import {
  PHOTO_SIZE_NAMES,
  PHOTO_SIZES,
  planVariants,
  variantDimensions,
} from './sizes'

/** Look a size up by name; the test fails loudly if the table changes. */
function size(name: string) {
  const found = PHOTO_SIZES.find((s) => s.name === name)
  if (!found) throw new Error(`no size ${name}`)
  return found
}

describe('PHOTO_SIZES', () => {
  it('keeps the legacy names and heights', () => {
    expect(PHOTO_SIZES).toEqual([
      { name: 'mobile_sm', height: 480 },
      { name: 'mobile_lg', height: 960 },
      { name: 'tablet', height: 1152 },
      { name: 'laptop', height: 1535 },
      { name: 'desktop', height: 2304 },
    ])
    expect(PHOTO_SIZE_NAMES).toEqual([
      'mobile_sm',
      'mobile_lg',
      'tablet',
      'laptop',
      'desktop',
    ])
  })
})

describe('variantDimensions', () => {
  // A real 4032x3024 photo in the database has these stored variant sizes.
  const original = { width: 4032, height: 3024 }

  it('scales to the target height keeping the aspect ratio', () => {
    expect(variantDimensions(original, size('mobile_sm'))).toEqual({
      width: 640,
      height: 480,
    })
    expect(variantDimensions(original, size('desktop'))).toEqual({
      width: 3072,
      height: 2304,
    })
  })

  it('rounds the width', () => {
    // 4032 * 1535 / 3024 = 2046.67
    expect(variantDimensions(original, size('laptop'))).toEqual({
      width: 2047,
      height: 1535,
    })
  })

  it('handles portrait originals', () => {
    expect(
      variantDimensions({ width: 3024, height: 4032 }, size('mobile_sm')),
    ).toEqual({ width: 360, height: 480 })
  })

  it('never upscales', () => {
    expect(
      variantDimensions({ width: 1600, height: 1200 }, size('tablet')),
    ).toEqual({ width: 1536, height: 1152 })
    expect(
      variantDimensions({ width: 1600, height: 1200 }, size('laptop')),
    ).toBeNull()
  })

  it('keeps an original exactly at the target height', () => {
    expect(
      variantDimensions({ width: 640, height: 480 }, size('mobile_sm')),
    ).toEqual({ width: 640, height: 480 })
  })

  it('rejects unknown or empty dimensions', () => {
    expect(
      variantDimensions({ width: 0, height: 0 }, size('mobile_sm')),
    ).toBeNull()
  })
})

describe('planVariants', () => {
  it('lists only the sizes the original can fill', () => {
    expect(
      planVariants({ width: 1600, height: 1200 }).map((v) => v.size.name),
    ).toEqual(['mobile_sm', 'mobile_lg', 'tablet'])
  })

  it('lists every size for a large original', () => {
    expect(planVariants({ width: 6000, height: 4000 })).toHaveLength(5)
  })
})
