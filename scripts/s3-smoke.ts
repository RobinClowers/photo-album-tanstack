/**
 * Round-trip an object against the configured photo bucket to prove the
 * credentials, bucket policy and client all work together.
 *
 *   bun --env-file=.dev.vars scripts/s3-smoke.ts
 *   AWS_PROFILE=photo-album-staging S3_BUCKET=robin-photos-staging bun scripts/s3-smoke.ts
 *   S3_ENDPOINT=http://127.0.0.1:9100 S3_BUCKET=test AWS_ACCESS_KEY_ID=... bun scripts/s3-smoke.ts
 *
 * With AWS_PROFILE and no static keys, credentials come from
 * `aws configure export-credentials`, so an SSO profile works without ever
 * writing keys to disk. Objects are written under `_smoke/` and removed
 * again; exit status is non-zero if any step fails.
 */
import { spawnSync } from 'node:child_process'
import { createS3Client } from '../src/server/s3'

interface ExportedCredentials {
  AccessKeyId: string
  SecretAccessKey: string
  SessionToken?: string
}

function credentialsFromProfile(profile: string): ExportedCredentials {
  const proc = spawnSync(
    'aws',
    [
      'configure',
      'export-credentials',
      '--profile',
      profile,
      '--format',
      'process',
    ],
    { encoding: 'utf8' },
  )
  if (proc.status !== 0) {
    throw new Error(
      `aws configure export-credentials failed for profile ${profile}: ${(proc.stderr || proc.error?.message || '').trim()}`,
    )
  }
  return JSON.parse(proc.stdout) as ExportedCredentials
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function resolveCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (accessKeyId && secretAccessKey) {
    return {
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }
  }
  const profile = process.env.AWS_PROFILE
  if (!profile) {
    throw new Error(
      'Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE (see .dev.vars.example)',
    )
  }
  const exported = credentialsFromProfile(profile)
  return {
    accessKeyId: exported.AccessKeyId,
    secretAccessKey: exported.SecretAccessKey,
    sessionToken: exported.SessionToken,
  }
}

const s3 = createS3Client({
  bucket: required('S3_BUCKET'),
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  ...resolveCredentials(),
})

const failures: string[] = []
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`ok   ${name}`)
  } catch (error) {
    failures.push(name)
    console.log(`FAIL ${name}`)
    console.log(
      `     ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const prefix = `_smoke/${new Date().toISOString().replace(/[:.]/g, '-')}`
const textKey = `${prefix}/hello.txt`
const streamKey = `${prefix}/stream.bin`
const body = `photo-album s3 smoke ${prefix}`
const streamBytes = new Uint8Array(64 * 1024).map((_, i) => i % 251)

console.log(`bucket ${s3.bucket} via ${s3.objectUrl('')}`)

await step('put text object', async () => {
  const { etag } = await s3.put(textKey, body, {
    contentType: 'text/plain; charset=utf-8',
  })
  assert(etag, 'no ETag returned')
})

await step('put streamed object with known length', async () => {
  await s3.put(streamKey, new Blob([streamBytes]).stream(), {
    contentType: 'application/octet-stream',
    contentLength: streamBytes.byteLength,
  })
})

await step('head reports size and content type', async () => {
  const info = await s3.head(textKey)
  assert(info, 'object missing')
  assert(
    info.size === new TextEncoder().encode(body).byteLength,
    `size ${info.size}`,
  )
  assert(
    info.contentType?.startsWith('text/plain'),
    `content type ${info.contentType}`,
  )
})

await step('get returns the body', async () => {
  const res = await s3.get(textKey)
  assert(res, 'object missing')
  assert((await res.text()) === body, 'body mismatch')
})

await step('get with a range returns a slice', async () => {
  const res = await s3.get(streamKey, { range: 'bytes=0-1023' })
  assert(res, 'object missing')
  assert(res.status === 206, `status ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  assert(bytes.byteLength === 1024, `got ${bytes.byteLength} bytes`)
  assert(
    bytes.every((b, i) => b === streamBytes[i]),
    'bytes differ',
  )
})

await step('list finds both objects under the prefix', async () => {
  const keys = (await s3.list(`${prefix}/`)).map((o) => o.key).sort()
  assert(
    JSON.stringify(keys) === JSON.stringify([textKey, streamKey].sort()),
    `listed ${keys.join(', ')}`,
  )
})

await step('object is publicly readable without credentials', async () => {
  const res = await fetch(s3.objectUrl(textKey))
  assert(res.status === 200, `status ${res.status} (bucket policy?)`)
  assert((await res.text()) === body, 'body mismatch')
})

await step('head of a missing key is null', async () => {
  assert((await s3.head(`${prefix}/nope.txt`)) === null, 'expected null')
})

await step('deleteObjects removes both', async () => {
  await s3.deleteObjects([textKey, streamKey, `${prefix}/never-existed.txt`])
  assert((await s3.head(textKey)) === null, 'text object still exists')
  assert((await s3.head(streamKey)) === null, 'stream object still exists')
})

await step('single delete of a missing key succeeds', async () => {
  await s3.delete(textKey)
})

if (failures.length) {
  console.log(`\n${failures.length} step(s) failed`)
  process.exit(1)
}
console.log('\nall steps passed')
