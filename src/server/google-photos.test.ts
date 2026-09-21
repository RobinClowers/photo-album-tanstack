import { describe, expect, it, vi } from 'vitest'
import {
  createPickerSession,
  durationToMs,
  GooglePhotosError,
  isImportablePhoto,
  listPickedMediaItems,
  originalDownloadUrl,
  type PickedMediaItem,
  resizedDownloadUrl,
} from './google-photos'

const item = (
  overrides: Partial<PickedMediaItem['mediaFile']> = {},
  type: PickedMediaItem['type'] = 'PHOTO',
): PickedMediaItem => ({
  id: 'abc',
  createTime: '2024-01-01T10:00:00Z',
  type,
  mediaFile: {
    baseUrl: 'https://lh3.googleusercontent.com/x',
    mimeType: 'image/jpeg',
    filename: 'IMG.jpg',
    ...overrides,
  },
})

describe('isImportablePhoto', () => {
  it('accepts jpeg, png and heic photos', () => {
    expect(isImportablePhoto(item())).toBe(true)
    expect(isImportablePhoto(item({ mimeType: 'image/png' }))).toBe(true)
    expect(isImportablePhoto(item({ mimeType: 'image/HEIC' }))).toBe(true)
  })

  it('rejects videos and other formats', () => {
    expect(isImportablePhoto(item({}, 'VIDEO'))).toBe(false)
    expect(isImportablePhoto(item({ mimeType: 'image/gif' }))).toBe(false)
  })
})

describe('download urls', () => {
  it('appends the Google size parameters', () => {
    expect(originalDownloadUrl('https://x/y')).toBe('https://x/y=d')
    expect(resizedDownloadUrl('https://x/y', 2304)).toBe(
      'https://x/y=w9216-h2304',
    )
  })

  it('widens the resize box so the height is the binding side', () => {
    expect(
      resizedDownloadUrl('https://x/y', 2304, { width: 4032, height: 3024 }),
    ).toBe('https://x/y=w3072-h2304')
    expect(
      resizedDownloadUrl('https://x/y', 2304, { width: 3024, height: 4032 }),
    ).toBe('https://x/y=w3072-h2304')
    expect(
      resizedDownloadUrl('https://x/y', 2304, { width: 9000, height: 3000 }),
    ).toBe('https://x/y=w6912-h2304')
  })
})

describe('durationToMs', () => {
  it('parses second durations and falls back otherwise', () => {
    expect(durationToMs('5s', 1000)).toBe(5000)
    expect(durationToMs('2.5s', 1000)).toBe(2500)
    expect(durationToMs(undefined, 1000)).toBe(1000)
    expect(durationToMs('soon', 1000)).toBe(1000)
  })
})

describe('Picker requests', () => {
  it('creates a session with the bearer token', async () => {
    const fetchImpl = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        expect(String(url)).toBe(
          'https://photospicker.googleapis.com/v1/sessions',
        )
        expect(init?.method).toBe('POST')
        expect(new Headers(init?.headers).get('authorization')).toBe(
          'Bearer tok',
        )
        return new Response(
          JSON.stringify({
            id: 's1',
            pickerUri: 'https://photos.google.com/picker/s1',
            mediaItemsSet: false,
          }),
        )
      },
    )
    const session = await createPickerSession(
      'tok',
      fetchImpl as unknown as typeof fetch,
    )
    expect(session.id).toBe('s1')
    expect(session.pickerUri).toContain('picker')
  })

  it('pages through picked items', async () => {
    const pages = [
      { mediaItems: [item({ filename: 'a.jpg' })], nextPageToken: 'p2' },
      { mediaItems: [item({ filename: 'b.jpg' })] },
    ]
    const urls: string[] = []
    const fetchImpl = vi.fn(async (url: RequestInfo | URL) => {
      urls.push(String(url))
      return new Response(JSON.stringify(pages.shift()))
    })
    const items = await listPickedMediaItems(
      'tok',
      's1',
      fetchImpl as unknown as typeof fetch,
    )
    expect(items.map((i) => i.mediaFile.filename)).toEqual(['a.jpg', 'b.jpg'])
    expect(urls[0]).toContain('sessionId=s1')
    expect(urls[0]).not.toContain('pageToken')
    expect(urls[1]).toContain('pageToken=p2')
  })

  it('throws a typed error with the response body', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('{"error":"nope"}', { status: 403 }),
    )
    const error = await createPickerSession(
      'tok',
      fetchImpl as unknown as typeof fetch,
    ).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GooglePhotosError)
    expect((error as GooglePhotosError).status).toBe(403)
    expect((error as GooglePhotosError).body).toBe('{"error":"nope"}')
  })
})
