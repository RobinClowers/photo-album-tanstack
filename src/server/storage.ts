import { env } from 'cloudflare:workers'

/**
 * Photo object storage on Cloudflare R2, reached through the `PHOTOS` bucket
 * binding (`robin-photos` in production, `robin-photos-staging` in staging,
 * an emulated bucket in local dev). Public reads go through the bucket's
 * custom domain, which is `VITE_PHOTO_BASE_URL`; this module is only for the
 * Worker's own reads and writes.
 *
 * The surface is deliberately small and storage-agnostic so the pipeline
 * code does not know about R2 specifics.
 */
export interface StorageObjectInfo {
  key: string
  size: number
  etag: string
  /** ISO 8601 upload time. */
  lastModified: string
  contentType: string | null
}

export type StoragePutBody =
  | ReadableStream<Uint8Array>
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | string

export interface StoragePutOptions {
  contentType?: string
  /**
   * Lets a stream be written without buffering: R2 needs to know the length
   * up front, so the Worker wraps the stream in a `FixedLengthStream`. When
   * the length is unknown, or outside the Workers runtime, the stream is
   * buffered instead.
   */
  contentLength?: number
  cacheControl?: string
}

export interface StorageRange {
  offset: number
  length: number
}

/** R2 deletes at most 1000 keys per call. */
const DELETE_BATCH_SIZE = 1000

interface FixedLengthStreamLike {
  readable: ReadableStream<Uint8Array>
  writable: WritableStream<Uint8Array>
}

function fixedLengthStream(length: number): FixedLengthStreamLike | null {
  const ctor = (
    globalThis as {
      FixedLengthStream?: new (length: number) => FixedLengthStreamLike
    }
  ).FixedLengthStream
  return ctor ? new ctor(length) : null
}

function toInfo(object: R2Object): StorageObjectInfo {
  return {
    key: object.key,
    size: object.size,
    etag: object.httpEtag,
    lastModified: object.uploaded.toISOString(),
    contentType: object.httpMetadata?.contentType ?? null,
  }
}

export function createStorage(bucket: R2Bucket) {
  /** Upload an object. Returns its ETag. */
  async function put(
    key: string,
    body: StoragePutBody,
    options: StoragePutOptions = {},
  ): Promise<{ etag: string }> {
    const httpMetadata: R2HTTPMetadata = {
      contentType: options.contentType ?? 'application/octet-stream',
    }
    if (options.cacheControl) httpMetadata.cacheControl = options.cacheControl

    let payload: StoragePutBody = body
    let pipe: Promise<void> = Promise.resolve()
    if (body instanceof ReadableStream) {
      const fixed =
        options.contentLength === undefined
          ? null
          : fixedLengthStream(options.contentLength)
      if (fixed) {
        pipe = body.pipeTo(fixed.writable)
        payload = fixed.readable
      } else {
        payload = await new Response(body).arrayBuffer()
      }
    }
    const [object] = await Promise.all([
      bucket.put(key, payload, { httpMetadata }),
      pipe,
    ])
    return { etag: object.httpEtag }
  }

  async function head(key: string): Promise<StorageObjectInfo | null> {
    const object = await bucket.head(key)
    return object ? toInfo(object) : null
  }

  /**
   * Fetch an object as a Response so callers can stream the body, read a
   * byte range, or buffer it, the same way they would a fetch() result.
   * Content-Length is the number of bytes in the body.
   */
  async function get(
    key: string,
    options: { range?: StorageRange } = {},
  ): Promise<Response | null> {
    const object = await bucket.get(
      key,
      options.range ? { range: options.range } : {},
    )
    if (!object) return null
    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set('etag', object.httpEtag)
    headers.set(
      'content-length',
      String(options.range ? options.range.length : object.size),
    )
    return new Response(object.body, {
      status: options.range ? 206 : 200,
      headers,
    })
  }

  /** Every object under `prefix`, following the listing cursor. */
  async function list(prefix: string): Promise<StorageObjectInfo[]> {
    const objects: StorageObjectInfo[] = []
    let cursor: string | undefined
    do {
      const page = await bucket.list({
        prefix,
        ...(cursor ? { cursor } : {}),
      })
      objects.push(...page.objects.map(toInfo))
      cursor = page.truncated ? page.cursor : undefined
    } while (cursor)
    return objects
  }

  /** Delete one object. Deleting a missing key is not an error. */
  async function deleteObject(key: string): Promise<void> {
    await bucket.delete(key)
  }

  /** Delete many objects, 1000 per call; missing keys are ignored. */
  async function deleteObjects(keys: readonly string[]): Promise<void> {
    const unique = [...new Set(keys)]
    for (let i = 0; i < unique.length; i += DELETE_BATCH_SIZE) {
      await bucket.delete(unique.slice(i, i + DELETE_BATCH_SIZE))
    }
  }

  return { put, head, get, list, delete: deleteObject, deleteObjects }
}

export type Storage = ReturnType<typeof createStorage>

let storage: Storage | undefined

/** The photo bucket for the current environment. */
export function getStorage(): Storage {
  storage ??= createStorage(env.PHOTOS)
  return storage
}
