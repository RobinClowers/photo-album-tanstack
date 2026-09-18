import { AwsClient } from 'aws4fetch'

/**
 * Minimal S3 client on aws4fetch, sized for a Worker's 10 ms CPU budget:
 * request bodies are never hashed (aws4fetch signs S3 requests with
 * `x-amz-content-sha256: UNSIGNED-PAYLOAD`), streams are passed straight
 * through to `fetch`, and the only parsing is a handful of XML tags.
 *
 * No retries here: a stream body cannot be replayed, and the queue consumer
 * that will drive uploads (PR 4) owns retry policy.
 */
export interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string | undefined
  /**
   * Alternative endpoint such as `http://127.0.0.1:9100` for MinIO. When set,
   * path-style addressing (`<endpoint>/<bucket>/<key>`) is used.
   */
  endpoint?: string | undefined
  /** Injectable for tests. Defaults to the global fetch. */
  fetch?: typeof fetch | undefined
}

export interface S3ObjectInfo {
  key: string
  size: number
  lastModified: string | null
  /** Only populated by `head`. */
  etag?: string | null
  contentType?: string | null
}

export type S3PutBody =
  | ReadableStream<Uint8Array>
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | string

export interface S3PutOptions {
  contentType?: string
  /**
   * Required to stream a body without buffering: S3 rejects chunked
   * transfer encoding, so the Worker wraps the stream in a
   * `FixedLengthStream` to send a Content-Length. Outside the Workers
   * runtime (no `FixedLengthStream`), or when the length is unknown, a
   * stream body is buffered instead.
   */
  contentLength?: number
  cacheControl?: string
}

export class S3Error extends Error {
  readonly status: number
  readonly code: string | null
  readonly key: string | undefined

  constructor(
    message: string,
    options: { status: number; code: string | null; key?: string },
  ) {
    super(message)
    this.name = 'S3Error'
    this.status = options.status
    this.code = options.code
    this.key = options.key
  }
}

const DELETE_BATCH_SIZE = 1000

/** S3 keys are encoded per path segment; `/` stays a separator. */
export function encodeObjectKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export function xmlEscape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c)
}

/**
 * Raw text of the first `<tag>` in `xml`, or null. Not entity-decoded: the
 * only values read from S3 responses are keys (requested URL-encoded, see
 * `list`), numbers, dates and error codes, none of which S3 escapes.
 */
function xmlTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml)
  return match?.[1] ?? null
}

/** Bodies of every `<tag>...</tag>` element (non-nested), in order. */
function xmlElements(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))]
    .map((m) => m[1])
    .filter((body): body is string => body !== undefined)
}

async function sha256Base64(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
}

async function errorFromResponse(
  res: Response,
  key?: string,
): Promise<S3Error> {
  const body = await res.text().catch(() => '')
  const code = xmlTag(body, 'Code')
  const message = xmlTag(body, 'Message')
  const where = key ? ` for ${key}` : ''
  return new S3Error(
    `S3 ${res.status}${code ? ` ${code}` : ''}${where}${message ? `: ${message}` : ''}`,
    { status: res.status, code, ...(key === undefined ? {} : { key }) },
  )
}

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

export function createS3Client(config: S3Config) {
  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    ...(config.sessionToken ? { sessionToken: config.sessionToken } : {}),
    service: 's3',
    region: config.region,
    retries: 0,
  })
  const doFetch = config.fetch ?? globalThis.fetch
  const bucketUrl = config.endpoint
    ? `${config.endpoint.replace(/\/$/, '')}/${config.bucket}`
    : `https://${config.bucket}.s3.${config.region}.amazonaws.com`

  /** URL of an object; also its public URL when the bucket allows reads. */
  function objectUrl(key: string, query?: Record<string, string>): string {
    const url = new URL(`${bucketUrl}/${encodeObjectKey(key)}`)
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v)
    return url.toString()
  }

  async function send(url: string, init: RequestInit): Promise<Response> {
    const request = await aws.sign(url, init)
    return doFetch(request)
  }

  /**
   * Upload an object. Streams are forwarded without being read in JS when
   * `contentLength` is known and the runtime has `FixedLengthStream`.
   */
  async function put(
    key: string,
    body: S3PutBody,
    options: S3PutOptions = {},
  ): Promise<{ etag: string | null }> {
    const headers = new Headers({
      'content-type': options.contentType ?? 'application/octet-stream',
    })
    if (options.cacheControl) headers.set('cache-control', options.cacheControl)

    // Every S3PutBody member is a valid BodyInit; the cast bridges TS's
    // stricter ArrayBufferView generic in lib.dom.
    let payload = body as BodyInit
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

    const [res] = await Promise.all([
      send(objectUrl(key), { method: 'PUT', headers, body: payload }),
      pipe,
    ])
    if (!res.ok) throw await errorFromResponse(res, key)
    await res.body?.cancel()
    return { etag: res.headers.get('etag') }
  }

  async function head(key: string): Promise<S3ObjectInfo | null> {
    const res = await send(objectUrl(key), { method: 'HEAD' })
    await res.body?.cancel()
    if (res.status === 404) return null
    if (!res.ok) throw await errorFromResponse(res, key)
    return {
      key,
      size: Number(res.headers.get('content-length') ?? 0),
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified'),
      contentType: res.headers.get('content-type'),
    }
  }

  /**
   * Fetch an object. Returns the raw Response so the caller can stream the
   * body (or read a byte range, e.g. the EXIF header) without buffering.
   */
  async function get(
    key: string,
    options: { range?: string } = {},
  ): Promise<Response | null> {
    const headers = new Headers()
    if (options.range) headers.set('range', options.range)
    const res = await send(objectUrl(key), { method: 'GET', headers })
    if (res.status === 404) {
      await res.body?.cancel()
      return null
    }
    if (!res.ok) throw await errorFromResponse(res, key)
    return res
  }

  /**
   * Every object under `prefix`, following continuation tokens. Keys are
   * requested URL-encoded so a key containing `&` or `<` needs no XML entity
   * handling, just `decodeURIComponent`.
   */
  async function list(
    prefix: string,
    options: { maxKeys?: number } = {},
  ): Promise<S3ObjectInfo[]> {
    const objects: S3ObjectInfo[] = []
    let continuationToken: string | null = null
    do {
      const url = new URL(bucketUrl.endsWith('/') ? bucketUrl : `${bucketUrl}/`)
      url.searchParams.set('list-type', '2')
      url.searchParams.set('encoding-type', 'url')
      url.searchParams.set('prefix', prefix)
      if (options.maxKeys) {
        url.searchParams.set('max-keys', String(options.maxKeys))
      }
      if (continuationToken) {
        url.searchParams.set('continuation-token', continuationToken)
      }
      const res = await send(url.toString(), { method: 'GET' })
      if (!res.ok) throw await errorFromResponse(res)
      const xml = await res.text()
      for (const entry of xmlElements(xml, 'Contents')) {
        const key = xmlTag(entry, 'Key')
        if (key === null) continue
        objects.push({
          key: decodeURIComponent(key.replace(/\+/g, '%20')),
          size: Number(xmlTag(entry, 'Size') ?? 0),
          lastModified: xmlTag(entry, 'LastModified'),
        })
      }
      continuationToken =
        xmlTag(xml, 'IsTruncated') === 'true'
          ? xmlTag(xml, 'NextContinuationToken')
          : null
    } while (continuationToken)
    return objects
  }

  /** Delete one object. Deleting a missing key is not an error. */
  async function deleteObject(key: string): Promise<void> {
    const res = await send(objectUrl(key), { method: 'DELETE' })
    await res.body?.cancel()
    if (!res.ok && res.status !== 404) throw await errorFromResponse(res, key)
  }

  /**
   * Delete many objects with DeleteObjects, 1000 per request. Throws an
   * S3Error naming the first key that failed if any did; missing keys are
   * reported as deleted by S3 and so never fail.
   */
  async function deleteObjects(keys: readonly string[]): Promise<void> {
    const unique = [...new Set(keys)]
    for (let i = 0; i < unique.length; i += DELETE_BATCH_SIZE) {
      const batch = unique.slice(i, i + DELETE_BATCH_SIZE)
      const body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>true</Quiet>${batch
        .map((key) => `<Object><Key>${xmlEscape(key)}</Key></Object>`)
        .join('')}</Delete>`
      const headers = new Headers({
        'content-type': 'application/xml',
        // S3 requires an integrity header on DeleteObjects; a SHA-256
        // checksum stands in for Content-MD5, which WebCrypto lacks.
        'x-amz-sdk-checksum-algorithm': 'SHA256',
        'x-amz-checksum-sha256': await sha256Base64(body),
      })
      const res = await send(`${bucketUrl}/?delete`, {
        method: 'POST',
        headers,
        body,
      })
      if (!res.ok) throw await errorFromResponse(res)
      const xml = await res.text()
      const [failure] = xmlElements(xml, 'Error')
      if (failure !== undefined) {
        const key = xmlTag(failure, 'Key') ?? undefined
        const code = xmlTag(failure, 'Code')
        throw new S3Error(
          `S3 DeleteObjects failed${key ? ` for ${key}` : ''}${code ? ` (${code})` : ''}: ${xmlTag(failure, 'Message') ?? 'unknown error'}`,
          { status: res.status, code, ...(key === undefined ? {} : { key }) },
        )
      }
    }
  }

  return {
    bucket: config.bucket,
    objectUrl: (key: string) => objectUrl(key),
    put,
    head,
    get,
    list,
    delete: deleteObject,
    deleteObjects,
  }
}

export type S3Client = ReturnType<typeof createS3Client>
