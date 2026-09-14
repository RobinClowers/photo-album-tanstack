import { describe, expect, it } from 'vitest'
import { parseRecordId } from './id'

describe('parseRecordId', () => {
  it('accepts positive integers', () => {
    expect(parseRecordId('1')).toBe(1)
    expect(parseRecordId('42')).toBe(42)
  })

  it('rejects zero and negatives', () => {
    expect(parseRecordId('0')).toBeNull()
    expect(parseRecordId('-1')).toBeNull()
  })

  it('rejects other numeric spellings that alias real ids', () => {
    expect(parseRecordId('0x10')).toBeNull()
    expect(parseRecordId('1e2')).toBeNull()
    expect(parseRecordId('1.0')).toBeNull()
    expect(parseRecordId('01')).toBeNull()
    expect(parseRecordId(' 1 ')).toBeNull()
  })

  it('rejects values beyond safe integers', () => {
    expect(parseRecordId('1e300')).toBeNull()
    expect(parseRecordId('9007199254740993')).toBeNull()
  })

  it('rejects empty and non-numeric input', () => {
    expect(parseRecordId('')).toBeNull()
    expect(parseRecordId('abc')).toBeNull()
  })
})
