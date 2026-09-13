import { describe, expect, it } from 'vitest'
import { isAdminEmail, parseAdminEmails } from './admin-allowlist'

describe('parseAdminEmails', () => {
  it('splits on commas, trims, lowercases and drops blanks', () => {
    expect(parseAdminEmails(' A@x.com, b@Y.com ,, ')).toEqual([
      'a@x.com',
      'b@y.com',
    ])
  })

  it('handles undefined', () => {
    expect(parseAdminEmails(undefined)).toEqual([])
  })
})

describe('isAdminEmail', () => {
  it('matches case-insensitively', () => {
    expect(isAdminEmail('Robin@Example.com', 'robin@example.com')).toBe(true)
  })

  it('rejects emails not on the list, and empty input', () => {
    expect(isAdminEmail('other@example.com', 'robin@example.com')).toBe(false)
    expect(isAdminEmail('', 'robin@example.com')).toBe(false)
    expect(isAdminEmail(null, 'robin@example.com')).toBe(false)
    expect(isAdminEmail('robin@example.com', '')).toBe(false)
  })
})
