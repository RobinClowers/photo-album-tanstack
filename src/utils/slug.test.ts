import { describe, expect, it } from 'vitest'
import { isValidSlug, slugify } from './slug'

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('San Cristobal 2019')).toBe('san-cristobal-2019')
  })

  it('strips diacritics and punctuation', () => {
    expect(slugify('Oaxaca — Día de Muertos!')).toBe('oaxaca-dia-de-muertos')
  })

  it('collapses runs of separators and trims the ends', () => {
    expect(slugify('  La   Paz -- 2018 ')).toBe('la-paz-2018')
  })

  it('returns an empty string when nothing is usable', () => {
    expect(slugify('***')).toBe('')
  })

  it('transliterates letters NFKD cannot decompose', () => {
    expect(slugify('Ærø')).toBe('aero')
    expect(slugify('Straße')).toBe('strasse')
    expect(slugify('Łódź')).toBe('lodz')
    expect(slugify('Đà Nẵng')).toBe('da-nang')
    expect(slugify('Œuvres de Þórshöfn')).toBe('oeuvres-de-thorshofn')
  })
})

describe('isValidSlug', () => {
  it('accepts dash-separated lowercase alphanumerics', () => {
    expect(isValidSlug('bangkok')).toBe(true)
    expect(isValidSlug('la-paz-2018')).toBe(true)
  })

  it('rejects uppercase, spaces, leading/trailing or double dashes', () => {
    expect(isValidSlug('La-Paz')).toBe(false)
    expect(isValidSlug('la paz')).toBe(false)
    expect(isValidSlug('-la-paz')).toBe(false)
    expect(isValidSlug('la--paz')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })
})
