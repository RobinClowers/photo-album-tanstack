import { env } from 'cloudflare:workers'
import { createS3Client, type S3Client } from './s3'

let storage: S3Client | undefined

/**
 * The photo bucket for the current environment. Bucket, region and the
 * (normally empty) endpoint override are `vars` in wrangler.jsonc; the key
 * pair is a per-environment secret. Locally, .dev.vars can override any of
 * them, which is how dev is pointed at MinIO (see .dev.vars.example).
 *
 * Built once per isolate: `env` is fixed for the isolate's lifetime, and the
 * client caches its derived SigV4 signing key, which a fresh client per
 * request would throw away.
 */
export function getStorage(): S3Client {
  if (storage) return storage
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET } =
    env
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'Storage is not configured: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (see .dev.vars.example)',
    )
  }
  // Typed as the literal "" from wrangler.jsonc; widen so an override counts.
  const endpoint: string = env.S3_ENDPOINT
  storage = createS3Client({
    bucket: S3_BUCKET,
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    endpoint: endpoint || undefined,
  })
  return storage
}
