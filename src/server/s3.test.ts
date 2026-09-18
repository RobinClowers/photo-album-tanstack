import { describe, expect, it, vi } from 'vitest'
import { createS3Client, encodeObjectKey, S3Error, xmlEscape } from './s3'

interface Captured {
  url: URL
  method: string
  headers: Headers
  body: string | null
}

/** A fetch stub that records requests and replays canned responses. */
function stubFetch(...responses: Response[]) {
  const calls: Captured[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request
    calls.push({
      url: new URL(request.url),
      method: request.method,
      headers: request.headers,
      body:
        request.method === 'GET' || request.method === 'HEAD'
          ? null
          : await request.text(),
    })
    const next = responses.shift()
    if (!next) throw new Error('unexpected fetch')
    return next
  })
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch }
}

function client(fetchImpl: typeof fetch, overrides = {}) {
  return createS3Client({
    bucket: 'robin-photos-staging',
    region: 'us-east-1',
    accessKeyId: 'AKIAEXAMPLE',
    secretAccessKey: 'secret',
    fetch: fetchImpl,
    ...overrides,
  })
}

const AUTH =
  /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\/\d{8}\/us-east-1\/s3\/aws4_request, SignedHeaders=.*, Signature=[0-9a-f]{64}$/

describe('object URLs', () => {
  it('uses virtual-hosted style against AWS', () => {
    const s3 = client(fetch)
    expect(s3.objectUrl('antarctica/desktop/P1040448.jpg')).toBe(
      'https://robin-photos-staging.s3.us-east-1.amazonaws.com/antarctica/desktop/P1040448.jpg',
    )
  })

  it('uses path style against a custom endpoint', () => {
    const s3 = client(fetch, { endpoint: 'http://127.0.0.1:9100/' })
    expect(s3.objectUrl('a/original/b.jpg')).toBe(
      'http://127.0.0.1:9100/robin-photos-staging/a/original/b.jpg',
    )
  })

  it('percent-encodes key segments but keeps slashes', () => {
    expect(encodeObjectKey('al bum/orig+inal/PANO~2 (1).jpg')).toBe(
      'al%20bum/orig%2Binal/PANO~2%20(1).jpg',
    )
  })
})

describe('put', () => {
  it('signs a PUT with an unsigned payload and the content type', async () => {
    const { calls, fetchImpl } = stubFetch(
      new Response(null, { status: 200, headers: { etag: '"abc"' } }),
    )
    const result = await client(fetchImpl).put(
      'trip/original/IMG.jpg',
      'hello',
      { contentType: 'image/jpeg', cacheControl: 'public, max-age=1' },
    )
    expect(result).toEqual({ etag: '"abc"' })
    const [req] = calls
    expect(req?.method).toBe('PUT')
    expect(req?.url.pathname).toBe('/trip/original/IMG.jpg')
    expect(req?.headers.get('content-type')).toBe('image/jpeg')
    expect(req?.headers.get('cache-control')).toBe('public, max-age=1')
    expect(req?.headers.get('x-amz-content-sha256')).toBe('UNSIGNED-PAYLOAD')
    expect(req?.headers.get('x-amz-date')).toMatch(/^\d{8}T\d{6}Z$/)
    expect(req?.headers.get('authorization')).toMatch(AUTH)
    expect(req?.body).toBe('hello')
  })

  it('buffers a stream when FixedLengthStream is unavailable', async () => {
    const { calls, fetchImpl } = stubFetch(new Response(null, { status: 200 }))
    const stream = new Blob(['streamed']).stream()
    await client(fetchImpl).put('k', stream, { contentLength: 8 })
    expect(calls[0]?.body).toBe('streamed')
  })

  it('uses FixedLengthStream when the runtime provides it', async () => {
    const seen: number[] = []
    class FakeFixedLengthStream extends TransformStream<
      Uint8Array,
      Uint8Array
    > {
      constructor(length: number) {
        super()
        seen.push(length)
      }
    }
    vi.stubGlobal('FixedLengthStream', FakeFixedLengthStream)
    try {
      const { calls, fetchImpl } = stubFetch(
        new Response(null, { status: 200 }),
      )
      await client(fetchImpl).put('k', new Blob(['12345']).stream(), {
        contentLength: 5,
      })
      expect(seen).toEqual([5])
      expect(calls[0]?.body).toBe('12345')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('throws an S3Error with the parsed code on failure', async () => {
    const { fetchImpl } = stubFetch(
      new Response(
        '<?xml version="1.0"?><Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>',
        { status: 403 },
      ),
    )
    const error = await client(fetchImpl)
      .put('trip/original/IMG.jpg', 'x')
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(S3Error)
    const s3Error = error as S3Error
    expect(s3Error.status).toBe(403)
    expect(s3Error.code).toBe('AccessDenied')
    expect(s3Error.key).toBe('trip/original/IMG.jpg')
    expect(s3Error.message).toBe(
      'S3 403 AccessDenied for trip/original/IMG.jpg: Access Denied',
    )
  })
})

describe('head and get', () => {
  it('returns object info from HEAD headers', async () => {
    const { calls, fetchImpl } = stubFetch(
      new Response(null, {
        status: 200,
        headers: {
          'content-length': '1774592',
          etag: '"d8f3"',
          'last-modified': 'Sat, 15 Dec 2018 10:03:28 GMT',
          'content-type': 'image/jpeg',
        },
      }),
    )
    const info = await client(fetchImpl).head('a/desktop/b.jpg')
    expect(calls[0]?.method).toBe('HEAD')
    expect(info).toEqual({
      key: 'a/desktop/b.jpg',
      size: 1774592,
      etag: '"d8f3"',
      lastModified: 'Sat, 15 Dec 2018 10:03:28 GMT',
      contentType: 'image/jpeg',
    })
  })

  it('returns null for a missing object', async () => {
    const { fetchImpl } = stubFetch(
      new Response(null, { status: 404 }),
      new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 }),
    )
    const s3 = client(fetchImpl)
    expect(await s3.head('missing')).toBeNull()
    expect(await s3.get('missing')).toBeNull()
  })

  it('forwards a Range header and returns the raw response', async () => {
    const { calls, fetchImpl } = stubFetch(
      new Response('exif-bytes', { status: 206 }),
    )
    const res = await client(fetchImpl).get('a/original/b.jpg', {
      range: 'bytes=0-262143',
    })
    expect(calls[0]?.headers.get('range')).toBe('bytes=0-262143')
    expect(await res?.text()).toBe('exif-bytes')
  })
})

describe('list', () => {
  // S3 with encoding-type=url: keys arrive percent-encoded, spaces as '+'.
  const page = (encodedKeys: string[], next?: string) =>
    new Response(
      `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>b</Name><EncodingType>url</EncodingType><IsTruncated>${next ? 'true' : 'false'}</IsTruncated>${
        next ? `<NextContinuationToken>${next}</NextContinuationToken>` : ''
      }${encodedKeys
        .map(
          (k, i) =>
            `<Contents><Key>${k}</Key><LastModified>2018-12-15T10:03:28.000Z</LastModified><ETag>&quot;e${i}&quot;</ETag><Size>${100 + i}</Size></Contents>`,
        )
        .join('')}</ListBucketResult>`,
      { status: 200 },
    )

  it('follows continuation tokens and decodes url-encoded keys', async () => {
    const { calls, fetchImpl } = stubFetch(
      page(['trip/original/a%26b+c.jpg'], 'tok/en='),
      page(['trip/original/c.jpg']),
    )
    const objects = await client(fetchImpl).list('trip/original/')
    expect(objects).toEqual([
      {
        key: 'trip/original/a&b c.jpg',
        size: 100,
        lastModified: '2018-12-15T10:03:28.000Z',
      },
      {
        key: 'trip/original/c.jpg',
        size: 100,
        lastModified: '2018-12-15T10:03:28.000Z',
      },
    ])
    expect(calls[0]?.url.searchParams.get('list-type')).toBe('2')
    expect(calls[0]?.url.searchParams.get('encoding-type')).toBe('url')
    expect(calls[0]?.url.searchParams.get('prefix')).toBe('trip/original/')
    expect(calls[0]?.url.searchParams.has('continuation-token')).toBe(false)
    expect(calls[1]?.url.searchParams.get('continuation-token')).toBe('tok/en=')
  })

  it('returns an empty list for an empty prefix', async () => {
    const { fetchImpl } = stubFetch(page([]))
    expect(await client(fetchImpl).list('nothing/')).toEqual([])
  })
})

describe('delete', () => {
  it('treats a 404 from DELETE as success', async () => {
    const { calls, fetchImpl } = stubFetch(new Response(null, { status: 404 }))
    await client(fetchImpl).delete('gone')
    expect(calls[0]?.method).toBe('DELETE')
  })

  it('sends a checksummed DeleteObjects body with unique keys', async () => {
    const { calls, fetchImpl } = stubFetch(
      new Response('<DeleteResult></DeleteResult>', { status: 200 }),
    )
    await client(fetchImpl).deleteObjects([
      'trip/original/a.jpg',
      'trip/desktop/a.jpg',
      'trip/original/a.jpg',
      'trip/mobile_sm/a&b.jpg',
    ])
    const [req] = calls
    expect(req?.method).toBe('POST')
    expect(`${req?.url.pathname}${req?.url.search}`).toBe('/?delete')
    expect(req?.headers.get('x-amz-checksum-sha256')).toMatch(
      /^[A-Za-z0-9+/]{43}=$/,
    )
    expect(req?.body).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>true</Quiet><Object><Key>trip/original/a.jpg</Key></Object><Object><Key>trip/desktop/a.jpg</Key></Object><Object><Key>trip/mobile_sm/a&amp;b.jpg</Key></Object></Delete>',
    )
  })

  it('does nothing for an empty key list', async () => {
    const { calls, fetchImpl } = stubFetch()
    await client(fetchImpl).deleteObjects([])
    expect(calls).toHaveLength(0)
  })

  it('splits into batches of 1000', async () => {
    const { calls, fetchImpl } = stubFetch(
      new Response('<DeleteResult/>', { status: 200 }),
      new Response('<DeleteResult/>', { status: 200 }),
    )
    const keys = Array.from({ length: 1001 }, (_, i) => `k/${i}.jpg`)
    await client(fetchImpl).deleteObjects(keys)
    expect(calls).toHaveLength(2)
    expect(calls[1]?.body).toContain('<Key>k/1000.jpg</Key>')
    expect(calls[1]?.body).not.toContain('<Key>k/999.jpg</Key>')
  })

  it('surfaces per-key errors from a 200 response', async () => {
    const { fetchImpl } = stubFetch(
      new Response(
        '<DeleteResult><Error><Key>trip/original/a.jpg</Key><Code>AccessDenied</Code><Message>Access Denied</Message></Error></DeleteResult>',
        { status: 200 },
      ),
    )
    const error = await client(fetchImpl)
      .deleteObjects(['trip/original/a.jpg'])
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(S3Error)
    expect((error as S3Error).key).toBe('trip/original/a.jpg')
    expect((error as S3Error).message).toBe(
      'S3 DeleteObjects failed for trip/original/a.jpg (AccessDenied): Access Denied',
    )
  })
})

describe('xmlEscape', () => {
  it('escapes the characters that would break a DeleteObjects body', () => {
    expect(xmlEscape(`a&b<c>"d'e`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;e')
  })
})
