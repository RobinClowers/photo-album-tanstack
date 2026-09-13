import { describe, expect, it } from 'vitest'
import { isSecureRequest, parseCookies, serializeCookie } from './cookies'

describe('serializeCookie', () => {
  it('defaults to Path=/, HttpOnly, SameSite=Lax and no Secure', () => {
    expect(serializeCookie('a', 'b')).toBe(
      'a=b; Path=/; HttpOnly; SameSite=Lax',
    )
  })

  it('adds Max-Age and Secure when given, and encodes the value', () => {
    expect(
      serializeCookie('s', 'x y', {
        maxAge: 60,
        secure: true,
        sameSite: 'strict',
      }),
    ).toBe('s=x%20y; Path=/; Max-Age=60; HttpOnly; Secure; SameSite=Strict')
  })
})

describe('parseCookies', () => {
  it('parses a cookie header', () => {
    expect(parseCookies('a=1; b=two%20words; c')).toEqual({
      a: '1',
      b: 'two words',
    })
  })

  it('returns an empty object for a missing header', () => {
    expect(parseCookies(null)).toEqual({})
  })
})

describe('isSecureRequest', () => {
  it('is true only for https URLs', () => {
    expect(isSecureRequest(new Request('https://x.test/'))).toBe(true)
    expect(isSecureRequest(new Request('http://localhost:3000/'))).toBe(false)
  })
})
