import { describe, expect, it, vi } from 'vitest'

// `cloudflare:workers` only resolves inside workerd; the module under test
// imports it for getStorage(), which these tests do not touch.
vi.mock('cloudflare:workers', () => ({ env: {} }))

const { createStorage } = await import('./storage')

interface Stored {
  bytes: Uint8Array
  contentType?: string
  cacheControl?: string
  uploaded: Date
}

/** Just enough of R2Bucket for the wrapper, in memory. */
function fakeBucket(pageSize = 1000) {
  const objects = new Map<string, Stored>()
  const calls: string[] = []

  const toObject = (key: string, stored: Stored, range?: R2Range) => {
    const offset = range && 'offset' in range ? (range.offset ?? 0) : 0
    const length =
      range && 'length' in range && range.length !== undefined
        ? range.length
        : stored.bytes.byteLength - offset
    const slice = stored.bytes.slice(offset, offset + length)
    return {
      key,
      size: stored.bytes.byteLength,
      etag: `etag-${key}`,
      httpEtag: `"etag-${key}"`,
      uploaded: stored.uploaded,
      httpMetadata: {
        contentType: stored.contentType,
        cacheControl: stored.cacheControl,
      },
      body: new Blob([slice]).stream(),
      writeHttpMetadata(headers: Headers) {
        if (stored.contentType) headers.set('content-type', stored.contentType)
        if (stored.cacheControl) {
          headers.set('cache-control', stored.cacheControl)
        }
      },
    }
  }

  const bucket = {
    async put(
      key: string,
      value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
      options?: R2PutOptions,
    ) {
      calls.push(`put ${key}`)
      const bytes = new Uint8Array(
        await new Response(value as BodyInit).arrayBuffer(),
      )
      const meta = options?.httpMetadata as R2HTTPMetadata | undefined
      const stored: Stored = {
        bytes,
        uploaded: new Date('2026-09-18T12:00:00Z'),
        ...(meta?.contentType ? { contentType: meta.contentType } : {}),
        ...(meta?.cacheControl ? { cacheControl: meta.cacheControl } : {}),
      }
      objects.set(key, stored)
      return toObject(key, stored)
    },
    async head(key: string) {
      calls.push(`head ${key}`)
      const stored = objects.get(key)
      return stored ? toObject(key, stored) : null
    },
    async get(key: string, options?: R2GetOptions) {
      calls.push(`get ${key}`)
      const stored = objects.get(key)
      return stored ? toObject(key, stored, options?.range as R2Range) : null
    },
    async delete(keys: string | string[]) {
      const list = Array.isArray(keys) ? keys : [keys]
      calls.push(`delete ${list.length}`)
      for (const key of list) objects.delete(key)
    },
    async list(options?: R2ListOptions) {
      const prefix = options?.prefix ?? ''
      const all = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort()
      const start = options?.cursor ? Number(options.cursor) : 0
      const page = all.slice(start, start + pageSize)
      const truncated = start + pageSize < all.length
      calls.push(`list ${prefix} from ${start}`)
      return {
        objects: page.map((k) => toObject(k, objects.get(k) as Stored)),
        truncated,
        cursor: truncated ? String(start + pageSize) : undefined,
        delimitedPrefixes: [],
      }
    },
  }
  return { bucket: bucket as unknown as R2Bucket, objects, calls }
}

describe('put', () => {
  it('stores bytes with the content type and cache control', async () => {
    const { bucket, objects } = fakeBucket()
    const result = await createStorage(bucket).put(
      'a/original/x.jpg',
      'hello',
      {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=1',
      },
    )
    expect(result).toEqual({ etag: '"etag-a/original/x.jpg"' })
    const stored = objects.get('a/original/x.jpg')
    expect(new TextDecoder().decode(stored?.bytes)).toBe('hello')
    expect(stored?.contentType).toBe('image/jpeg')
    expect(stored?.cacheControl).toBe('public, max-age=1')
  })

  it('defaults the content type', async () => {
    const { bucket, objects } = fakeBucket()
    await createStorage(bucket).put('k', new Uint8Array([1, 2, 3]))
    expect(objects.get('k')?.contentType).toBe('application/octet-stream')
  })

  it('buffers a stream when FixedLengthStream is unavailable', async () => {
    const { bucket, objects } = fakeBucket()
    await createStorage(bucket).put('k', new Blob(['streamed']).stream(), {
      contentLength: 8,
    })
    expect(new TextDecoder().decode(objects.get('k')?.bytes)).toBe('streamed')
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
      const { bucket, objects } = fakeBucket()
      await createStorage(bucket).put('k', new Blob(['12345']).stream(), {
        contentLength: 5,
      })
      expect(seen).toEqual([5])
      expect(new TextDecoder().decode(objects.get('k')?.bytes)).toBe('12345')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('head and get', () => {
  it('describes a stored object', async () => {
    const { bucket } = fakeBucket()
    const storage = createStorage(bucket)
    await storage.put('a/desktop/b.jpg', 'x'.repeat(10), {
      contentType: 'image/jpeg',
    })
    expect(await storage.head('a/desktop/b.jpg')).toEqual({
      key: 'a/desktop/b.jpg',
      size: 10,
      etag: '"etag-a/desktop/b.jpg"',
      lastModified: '2026-09-18T12:00:00.000Z',
      contentType: 'image/jpeg',
    })
  })

  it('returns null for a missing object', async () => {
    const { bucket } = fakeBucket()
    const storage = createStorage(bucket)
    expect(await storage.head('missing')).toBeNull()
    expect(await storage.get('missing')).toBeNull()
  })

  it('returns a Response with length, type and body', async () => {
    const { bucket } = fakeBucket()
    const storage = createStorage(bucket)
    await storage.put('k', 'hello world', { contentType: 'text/plain' })
    const res = await storage.get('k')
    expect(res?.status).toBe(200)
    expect(res?.headers.get('content-length')).toBe('11')
    expect(res?.headers.get('content-type')).toBe('text/plain')
    expect(res?.headers.get('etag')).toBe('"etag-k"')
    expect(await res?.text()).toBe('hello world')
  })

  it('serves a byte range as 206', async () => {
    const { bucket } = fakeBucket()
    const storage = createStorage(bucket)
    await storage.put('k', 'hello world')
    const res = await storage.get('k', { range: { offset: 6, length: 5 } })
    expect(res?.status).toBe(206)
    expect(res?.headers.get('content-length')).toBe('5')
    expect(await res?.text()).toBe('world')
  })
})

describe('list', () => {
  it('follows the cursor across pages and respects the prefix', async () => {
    const { bucket, calls } = fakeBucket(2)
    const storage = createStorage(bucket)
    for (const k of [
      't/original/a.jpg',
      't/original/b.jpg',
      't/original/c.jpg',
      'u/original/d.jpg',
    ]) {
      await storage.put(k, 'x')
    }
    const keys = (await storage.list('t/original/')).map((o) => o.key)
    expect(keys).toEqual([
      't/original/a.jpg',
      't/original/b.jpg',
      't/original/c.jpg',
    ])
    expect(calls.filter((c) => c.startsWith('list'))).toEqual([
      'list t/original/ from 0',
      'list t/original/ from 2',
    ])
  })

  it('returns an empty list for an empty prefix', async () => {
    const { bucket } = fakeBucket()
    expect(await createStorage(bucket).list('nothing/')).toEqual([])
  })
})

describe('delete', () => {
  it('removes one object and tolerates a missing key', async () => {
    const { bucket, objects } = fakeBucket()
    const storage = createStorage(bucket)
    await storage.put('k', 'x')
    await storage.delete('k')
    await storage.delete('k')
    expect(objects.has('k')).toBe(false)
  })

  it('deletes many keys in one call, deduplicated', async () => {
    const { bucket, objects, calls } = fakeBucket()
    const storage = createStorage(bucket)
    await storage.put('a', 'x')
    await storage.put('b', 'x')
    await storage.deleteObjects(['a', 'b', 'a', 'never-existed'])
    expect(objects.size).toBe(0)
    expect(calls.filter((c) => c.startsWith('delete'))).toEqual(['delete 3'])
  })

  it('splits into batches of 1000', async () => {
    const { bucket, calls } = fakeBucket()
    const keys = Array.from({ length: 1001 }, (_, i) => `k/${i}.jpg`)
    await createStorage(bucket).deleteObjects(keys)
    expect(calls.filter((c) => c.startsWith('delete'))).toEqual([
      'delete 1000',
      'delete 1',
    ])
  })

  it('does nothing for an empty key list', async () => {
    const { bucket, calls } = fakeBucket()
    await createStorage(bucket).deleteObjects([])
    expect(calls).toEqual([])
  })
})
