/**
 * The size variants every photo gets, unchanged from the Rails app so the
 * ~7,750 existing photo_versions rows and the public front end keep working.
 * Each variant is scaled to a fixed height with the width following the
 * original's aspect ratio (RMagick geometry `x<height>`).
 */
export interface PhotoSize {
  name: string
  height: number
}

export const PHOTO_SIZES: readonly PhotoSize[] = [
  { name: 'mobile_sm', height: 480 },
  { name: 'mobile_lg', height: 960 },
  { name: 'tablet', height: 1152 },
  { name: 'laptop', height: 1535 },
  { name: 'desktop', height: 2304 },
]

export const ORIGINAL_SIZE = 'original'

export const PHOTO_SIZE_NAMES = PHOTO_SIZES.map((s) => s.name)

/** The variants are always encoded as JPEG, whatever the source format. */
export const VARIANT_MIME_TYPE = 'image/jpeg'
export const VARIANT_QUALITY = 85

export interface Dimensions {
  width: number
  height: number
}

/**
 * Pixel dimensions a variant will have, or null when the original is not
 * tall enough: the pipeline never upscales, matching the Rails processor
 * which skipped sizes the source was too small for (that is why a short
 * photo has fewer photo_versions rows than a tall one).
 */
export function variantDimensions(
  original: Dimensions,
  size: PhotoSize,
): Dimensions | null {
  if (original.width <= 0 || original.height <= 0) return null
  if (original.height < size.height) return null
  return {
    width: Math.round((original.width * size.height) / original.height),
    height: size.height,
  }
}

/** Every size the original is large enough for, with its target dimensions. */
export function planVariants(original: Dimensions) {
  return PHOTO_SIZES.flatMap((size) => {
    const dimensions = variantDimensions(original, size)
    return dimensions ? [{ size, ...dimensions }] : []
  })
}
