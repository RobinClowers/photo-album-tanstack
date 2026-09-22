import { describe, expect, it } from 'vitest'
import type { Photo } from '@/db/schema'
import type { PhotoExif } from '@/server/images/exif'
import { photoBackfill } from './process-photo'

const basePhoto: Photo = {
  id: 1,
  filename: 'IMG_0001.jpg',
  createdAt: null,
  updatedAt: null,
  path: 'trip',
  albumId: 1,
  caption: null,
  mimeType: null,
  googleId: null,
  takenAt: null,
  width: null,
  height: null,
  cameraMake: null,
  cameraModel: null,
  focalLength: null,
  apertureFNumber: null,
  isoEquivalent: null,
  exposureTime: null,
  lat: null,
  lon: null,
}

const exif: PhotoExif = {
  takenAt: '2018-07-03 10:31:30',
  cameraMake: 'Google',
  cameraModel: 'Pixel 2',
  focalLength: 4.442,
  apertureFNumber: 1.8,
  isoEquivalent: 58,
  exposureTime: '1/4673',
  lat: '9.45096944',
  lon: '100.02960556',
  orientation: 1,
}

describe('photoBackfill', () => {
  it('fills every empty column from dimensions and EXIF', () => {
    expect(
      photoBackfill(
        basePhoto,
        { width: 4032, height: 3024 },
        'image/jpeg',
        exif,
        false,
      ),
    ).toEqual({
      width: 4032,
      height: 3024,
      mimeType: 'image/jpeg',
      takenAt: '2018-07-03 10:31:30',
      cameraMake: 'Google',
      cameraModel: 'Pixel 2',
      focalLength: 4.442,
      apertureFNumber: 1.8,
      isoEquivalent: 58,
      exposureTime: '1/4673',
      lat: '9.45096944',
      lon: '100.02960556',
    })
  })

  it('keeps existing values unless forced', () => {
    const photo = { ...basePhoto, takenAt: '2018-07-04 00:00:00', width: 100 }
    const patch = photoBackfill(
      photo,
      { width: 4032, height: 3024 },
      'image/jpeg',
      exif,
      false,
    )
    expect(patch.takenAt).toBeUndefined()
    expect(patch.width).toBeUndefined()
    expect(patch.height).toBe(3024)

    const forced = photoBackfill(
      photo,
      { width: 4032, height: 3024 },
      'image/jpeg',
      exif,
      true,
    )
    expect(forced.takenAt).toBe('2018-07-03 10:31:30')
    expect(forced.width).toBe(4032)
  })

  it('never writes nulls over existing values', () => {
    const photo = { ...basePhoto, lat: '1.5', lon: '2.5' }
    const patch = photoBackfill(
      photo,
      { width: 10, height: 10 },
      'image/jpeg',
      { ...exif, lat: null, lon: null },
      true,
    )
    expect(patch).not.toHaveProperty('lat')
    expect(patch).not.toHaveProperty('lon')
  })

  it('handles a photo with no EXIF at all', () => {
    expect(
      photoBackfill(
        basePhoto,
        { width: 10, height: 20 },
        'image/png',
        null,
        false,
      ),
    ).toEqual({ width: 10, height: 20, mimeType: 'image/png' })
  })
})
