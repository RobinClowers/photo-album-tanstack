/**
 * Google Photos Picker API client. Pure fetch functions with the access
 * token passed in, so they are easy to unit test and reuse from the queue
 * consumer. https://developers.google.com/photos/picker/reference/rest
 *
 * The Library API can no longer list a user's own albums (since March 2025),
 * so the admin picks photos in Google's own UI: create a session, send them
 * to `pickerUri`, poll until `mediaItemsSet`, then page through the picked
 * items and download each `baseUrl`. Base URLs are valid for about an hour
 * and need the bearer token.
 */
export const PICKER_SCOPE =
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly'

export const PICKER_API_URL = 'https://photospicker.googleapis.com/v1'

/** Sessions hold at most this many picked items. */
export const PICKER_MAX_ITEMS = 2000

export interface PickerSession {
  id: string
  pickerUri: string
  mediaItemsSet: boolean
  /** RFC 3339. */
  expireTime?: string
  pollingConfig?: {
    /** Duration string such as "5s". */
    pollInterval?: string
    timeoutIn?: string
  }
}

export interface PickedPhotoMetadata {
  focalLength?: number
  apertureFNumber?: number
  isoEquivalent?: number
  /** Duration string such as "0.001s". */
  exposureTime?: string
}

export interface PickedMediaItem {
  id: string
  /** RFC 3339. */
  createTime: string
  type: 'PHOTO' | 'VIDEO' | 'TYPE_UNSPECIFIED'
  mediaFile: {
    baseUrl: string
    mimeType: string
    filename: string
    mediaFileMetadata?: {
      width?: number
      height?: number
      cameraMake?: string
      cameraModel?: string
      photoMetadata?: PickedPhotoMetadata
    }
  }
}

export class GooglePhotosError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message)
    this.name = 'GooglePhotosError'
  }
}

async function request<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const res = await fetchImpl(`${PICKER_API_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    throw new GooglePhotosError(
      `Google Photos Picker ${init.method ?? 'GET'} ${path} failed`,
      res.status,
      await res.text(),
    )
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function createPickerSession(
  accessToken: string,
  fetchImpl?: typeof fetch,
): Promise<PickerSession> {
  return request<PickerSession>(
    accessToken,
    '/sessions',
    { method: 'POST', body: '{}' },
    fetchImpl,
  )
}

export function getPickerSession(
  accessToken: string,
  sessionId: string,
  fetchImpl?: typeof fetch,
): Promise<PickerSession> {
  return request<PickerSession>(
    accessToken,
    `/sessions/${encodeURIComponent(sessionId)}`,
    {},
    fetchImpl,
  )
}

export function deletePickerSession(
  accessToken: string,
  sessionId: string,
  fetchImpl?: typeof fetch,
): Promise<void> {
  return request<void>(
    accessToken,
    `/sessions/${encodeURIComponent(sessionId)}`,
    { method: 'DELETE' },
    fetchImpl,
  )
}

/** Every item picked in a session, following `nextPageToken`. */
export async function listPickedMediaItems(
  accessToken: string,
  sessionId: string,
  fetchImpl?: typeof fetch,
): Promise<PickedMediaItem[]> {
  const items: PickedMediaItem[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({ sessionId, pageSize: '100' })
    if (pageToken) params.set('pageToken', pageToken)
    const page = await request<{
      mediaItems?: PickedMediaItem[]
      nextPageToken?: string
    }>(accessToken, `/mediaItems?${params}`, {}, fetchImpl)
    items.push(...(page.mediaItems ?? []))
    pageToken = page.nextPageToken
  } while (pageToken)
  return items
}

/** URL for the original bytes with metadata. */
export function originalDownloadUrl(baseUrl: string): string {
  return `${baseUrl}=d`
}

/** URL for a server-side resized copy, the fallback for oversized originals. */
export function resizedDownloadUrl(baseUrl: string, maxPx: number): string {
  return `${baseUrl}=w${maxPx}-h${maxPx}`
}

/** "5s" → 5000; unknown formats fall back to `fallbackMs`. */
export function durationToMs(value: string | undefined, fallbackMs: number) {
  const match = value ? /^(\d+(?:\.\d+)?)s$/.exec(value) : null
  return match?.[1] ? Math.round(Number(match[1]) * 1000) : fallbackMs
}

/** Mime types the pipeline can turn into variants. */
export const IMPORTABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
])

export function isImportablePhoto(item: PickedMediaItem): boolean {
  return (
    item.type === 'PHOTO' &&
    IMPORTABLE_MIME_TYPES.has(item.mediaFile.mimeType.toLowerCase())
  )
}
