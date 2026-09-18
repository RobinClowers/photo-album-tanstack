import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  formatExifDate,
  formatExposureTime,
  isRotated,
  parseExif,
} from './exif'

// The two fixtures are the Rails ExifReader spec's, so the expected values
// below are what exiftool reported for them (see spec/models/exif_reader_spec.rb).
const fixture = (name: string) =>
  readFile(new URL(`./fixtures/${name}`, import.meta.url))

describe('parseExif', () => {
  it('reads camera, exposure, date and GPS from a Panasonic JPEG', async () => {
    expect(await parseExif(await fixture('P1080205.JPG'))).toEqual({
      takenAt: '2017-01-27 17:55:53',
      cameraMake: 'Panasonic',
      cameraModel: 'DMC-ZS40',
      focalLength: 4.3,
      apertureFNumber: 3.3,
      isoEquivalent: 160,
      exposureTime: '1/1000',
      lat: '9.45096944',
      lon: '100.02960556',
      orientation: 1,
    })
  })

  it('leaves coordinates null when there is no GPS block', async () => {
    expect(await parseExif(await fixture('P1120375.JPG'))).toEqual({
      takenAt: '2013-01-16 23:15:41',
      cameraMake: 'Panasonic',
      cameraModel: 'DMC-FS15',
      focalLength: 5.2,
      apertureFNumber: 4,
      isoEquivalent: 125,
      exposureTime: '1/640',
      lat: null,
      lon: null,
      orientation: 1,
    })
  })

  it('returns null for bytes without EXIF', async () => {
    // Smallest valid JPEG header followed by garbage: no APP1 segment.
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xdb, 0, 4, 0, 0, 0xff, 0xd9,
    ])
    expect(await parseExif(bytes).catch(() => null)).toBeNull()
  })
})

describe('formatExposureTime', () => {
  it('renders fractions of a second the way exiftool does', () => {
    expect(formatExposureTime(0.001)).toBe('1/1000')
    expect(formatExposureTime(0.0015625)).toBe('1/640')
    expect(formatExposureTime(0.5)).toBe('1/2')
  })

  it('renders long exposures as seconds', () => {
    expect(formatExposureTime(2)).toBe('2')
    expect(formatExposureTime(1.3)).toBe('1.3')
  })

  it('rejects missing or nonsense values', () => {
    expect(formatExposureTime(null)).toBeNull()
    expect(formatExposureTime(0)).toBeNull()
  })
})

describe('formatExifDate', () => {
  it('converts the EXIF colon format to the storage format', () => {
    expect(formatExifDate('2017:01:27 17:55:53')).toBe('2017-01-27 17:55:53')
  })

  it('ignores unparseable strings', () => {
    expect(formatExifDate('    :  :     :  :  ')).toBeNull()
    expect(formatExifDate(null)).toBeNull()
  })
})

describe('isRotated', () => {
  it('is true only for the 90-degree orientations', () => {
    expect(isRotated(1)).toBe(false)
    expect(isRotated(3)).toBe(false)
    expect(isRotated(6)).toBe(true)
    expect(isRotated(8)).toBe(true)
    expect(isRotated(null)).toBe(false)
  })
})
