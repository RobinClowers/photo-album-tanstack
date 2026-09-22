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

/**
 * URL for a server-side resized copy at least `height` pixels tall, the
 * fallback for oversized originals. Google requires both `w` and `h` and
 * scales the image to fit inside that box without upscaling, so the box is
 * made as wide as the original's aspect ratio needs for the height to be the
 * binding side: a square box would leave a landscape copy shorter than
 * `height` and lose the tallest variants. Either orientation of the given
 * dimensions is allowed for; without them the box is four times wider than
 * tall.
 */
export function resizedDownloadUrl(
  baseUrl: string,
  height: number,
  original?: { width: number; height: number } | null,
): string {
  const width =
    original && original.width > 0 && original.height > 0
      ? Math.ceil(
          (height * Math.max(original.width, original.height)) /
            Math.min(original.width, original.height),
        )
      : height * 4
  return `${baseUrl}=w${width}-h${height}`
}

/**
 * Google's JSON Duration ("5s", "0.001s") → seconds; anything else → null.
 * Shared by the picker's poll interval and the photo metadata's exposure.
 */
export function parseDurationSeconds(value: string | undefined): number | null {
  const match = value ? /^(\d+(?:\.\d+)?)s$/.exec(value) : null
  const seconds = match?.[1] ? Number(match[1]) : Number.NaN
  return Number.isFinite(seconds) ? seconds : null
}

/** "5s" → 5000; unknown formats fall back to `fallbackMs`. */
export function durationToMs(value: string | undefined, fallbackMs: number) {
  const seconds = parseDurationSeconds(value)
  return seconds === null ? fallbackMs : Math.round(seconds * 1000)
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
