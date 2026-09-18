import { env } from 'cloudflare:workers'
import type { Photo, PhotoVersion } from '@/db/schema'
import { photoObjectKey } from '@/utils/photo'
import { createS3Client, type S3Client } from './s3'

/**
 * The photo bucket for the current environment. Bucket, region and the
 * (normally empty) endpoint override are `vars` in wrangler.jsonc; the key
 * pair is a per-environment secret. Locally, .dev.vars can override any of
 * them, which is how dev is pointed at MinIO (see .dev.vars.example).
 */
export function getStorage(): S3Client {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } =
    env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'Storage is not configured: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (see .dev.vars.example)',
    )
  }
  // Typed as the literal "" from wrangler.jsonc; widen so an override counts.
  const endpoint: string = env.S3_ENDPOINT
  return createS3Client({
    bucket: S3_BUCKET,
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    endpoint: endpoint || undefined,
  })
}

/**
 * Every object key a photo owns: one per `photo_versions` row (the original
 * is stored as a version too). Rows missing a size or filename, or a photo
 * with no path, yield nothing rather than a malformed key.
 */
export function photoObjectKeys(
  photo: Pick<Photo, 'path'>,
  versions: readonly Pick<PhotoVersion, 'size' | 'filename'>[],
): string[] {
  if (!photo.path) return []
  const keys = new Set<string>()
  for (const version of versions) {
    if (!version.size || !version.filename) continue
    keys.add(photoObjectKey(photo.path, version.size, version.filename))
  }
  return [...keys]
}
