import * as exifr from 'exifr/dist/lite.esm.mjs'

/**
 * The photo metadata the `photos` table stores, in its storage formats:
 * `taken_at` as 'YYYY-MM-DD HH:MM:SS' with no zone (the camera's local
 * time, as the Rails app stored it), `exposure_time` as a fraction string
 * like '1/1000', coordinates as decimal-degree strings.
 */
export interface PhotoExif {
  takenAt: string | null
  cameraMake: string | null
  cameraModel: string | null
  focalLength: number | null
  apertureFNumber: number | null
  isoEquivalent: number | null
  exposureTime: string | null
  lat: string | null
  lon: string | null
  /** EXIF orientation 1-8; 5-8 mean the stored pixels are rotated 90°. */
  orientation: number | null
}

/** Only these tags are decoded, per IFD; everything else is skipped. */
const IFD0_TAGS = ['Make', 'Model', 'Orientation']
const EXIF_TAGS = [
  'ExposureTime',
  'FNumber',
  'FocalLength',
  'ISO',
  'DateTimeOriginal',
]
const GPS_TAGS = [
  'GPSLatitude',
  'GPSLatitudeRef',
  'GPSLongitude',
  'GPSLongitudeRef',
]

interface RawExif {
  Make?: unknown
  Model?: unknown
  ExposureTime?: unknown
  FNumber?: unknown
  FocalLength?: unknown
  ISO?: unknown
  DateTimeOriginal?: unknown
  Orientation?: unknown
  GPSLatitude?: unknown
  GPSLatitudeRef?: unknown
  GPSLongitude?: unknown
  GPSLongitudeRef?: unknown
  latitude?: unknown
  longitude?: unknown
}

/**
 * Best-effort EXIF read. Returns null when the bytes carry no EXIF at all;
 * throws only if the parser itself blows up, which callers treat as
 * "no EXIF" too.
 */
export async function parseExif(
  bytes: ArrayBuffer | Uint8Array,
): Promise<PhotoExif | null> {
  const raw = (await exifr.parse(bytes, {
    ifd0: { pick: IFD0_TAGS },
    exif: { pick: EXIF_TAGS },
    gps: { pick: GPS_TAGS },
    // Raw numbers and strings: revived Dates would be shifted into the
    // Worker's zone, and translated enums are only for display.
    translateValues: false,
    reviveValues: false,
    mergeOutput: true,
  })) as RawExif | undefined
  if (!raw) return null

  return {
    takenAt: formatExifDate(asString(raw.DateTimeOriginal)),
    cameraMake: trimmed(asString(raw.Make)),
    cameraModel: trimmed(asString(raw.Model)),
    focalLength: asNumber(raw.FocalLength),
    apertureFNumber: asNumber(raw.FNumber),
    isoEquivalent: asInteger(raw.ISO),
    exposureTime: formatExposureTime(asNumber(raw.ExposureTime)),
    lat: coordinate(raw.latitude, raw.GPSLatitude, raw.GPSLatitudeRef, 'S'),
    lon: coordinate(raw.longitude, raw.GPSLongitude, raw.GPSLongitudeRef, 'W'),
    orientation: asInteger(raw.Orientation),
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function trimmed(value: string | null): string | null {
  const t = value?.replace(/\0+$/, '').trim()
  return t ? t : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asInteger(value: unknown): number | null {
  const n = asNumber(value)
  return n === null ? null : Math.round(n)
}

/** '2017:01:27 17:55:53' → '2017-01-27 17:55:53'; anything else → null. */
export function formatExifDate(value: string | null): string | null {
  const match = value
    ? /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(value)
    : null
  if (!match) return null
  const [, y, mo, d, h, mi, s] = match
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

/**
 * Seconds → the fraction photographers read: 0.001 → '1/1000', 0.5 → '1/2',
 * 2 → '2', 1.3 → '1.3'. Matches the exiftool strings the legacy rows hold.
 */
export function formatExposureTime(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null
  if (seconds >= 1) return String(Number(seconds.toFixed(1)))
  return `1/${Math.round(1 / seconds)}`
}

/**
 * Decimal degrees as a string. exifr supplies `latitude`/`longitude` when it
 * can; otherwise convert the degrees/minutes/seconds triple, negated for the
 * southern or western hemisphere.
 */
function coordinate(
  decimal: unknown,
  dms: unknown,
  ref: unknown,
  negativeRef: 'S' | 'W',
): string | null {
  let value = asNumber(decimal)
  if (value === null && Array.isArray(dms) && dms.length === 3) {
    const [d, m, s] = dms.map((v) => asNumber(v))
    if (d == null || m == null || s == null) return null
    value = d + m / 60 + s / 3600
    if (typeof ref === 'string' && ref.toUpperCase().startsWith(negativeRef)) {
      value = -value
    }
  }
  if (value === null) return null
  return String(Number(value.toFixed(8)))
}

/** Whether EXIF orientation says the stored pixels are rotated 90 degrees. */
export function isRotated(orientation: number | null): boolean {
  return orientation !== null && orientation >= 5 && orientation <= 8
}
