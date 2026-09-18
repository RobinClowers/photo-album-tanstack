/**
 * Photo filenames as they appear in S3 keys and `photos.filename`.
 *
 * Ported from the Rails `Photo::FilenameScrubber`: every dot except the one
 * before the extension becomes a dash, so `IMG.vr~2.jpg` is stored as
 * `IMG-vr~2.jpg`. The public routes and the legacy keys both depend on a
 * filename having exactly one dot, so this has to match the original
 * behaviour byte for byte.
 */
export function scrubFilename(filename: string): string {
  return filename.replace(/\.(?=.*\.)/g, '-')
}

/**
 * Filename of a resized variant: same basename as the original with a `.jpg`
 * extension, since every variant is written as JPEG regardless of the source
 * format. Files without an extension get `.jpg` appended.
 */
export function variantFilename(filename: string): string {
  const dot = filename.lastIndexOf('.')
  const base = dot > 0 ? filename.slice(0, dot) : filename
  return `${base}.jpg`
}

/**
 * Mirrors the Rails `Photo::VALID_FILENAME_REGEX` intent: the import path
 * only accepts JPEG and PNG sources.
 */
export function isSupportedPhotoFilename(filename: string): boolean {
  return /\.(jpe?g|png)$/i.test(filename)
}
