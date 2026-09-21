import { describe, expect, it } from 'vitest'
import {
  buildAuthUrl,
  GOOGLE_AUTH_URL,
  hasScope,
  LOGIN_SCOPES,
  parsePurpose,
  photosPurpose,
  safeReturnTo,
} from './google-oauth'

describe('buildAuthUrl', () => {
  const base = {
    clientId: 'client-id',
    redirectUri: 'http://localhost:3000/api/auth/google/callback',
    state: 'abc123',
    scopes: LOGIN_SCOPES,
  }

  it('targets the Google authorization endpoint with the code flow', () => {
    const url = new URL(buildAuthUrl(base))
    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_AUTH_URL)
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('client_id')).toBe('client-id')
    expect(url.searchParams.get('redirect_uri')).toBe(base.redirectUri)
    expect(url.searchParams.get('state')).toBe('abc123')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('include_granted_scopes')).toBe('true')
  })

  it('omits offline/consent/login_hint unless requested', () => {
    const url = new URL(buildAuthUrl(base))
    expect(url.searchParams.has('access_type')).toBe(false)
    expect(url.searchParams.has('prompt')).toBe(false)
    expect(url.searchParams.has('login_hint')).toBe(false)
  })

  it('adds offline access, forced consent and login hint when asked', () => {
    const url = new URL(
      buildAuthUrl({
        ...base,
        offline: true,
        forceConsent: true,
        loginHint: 'me@example.com',
      }),
    )
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('prompt')).toBe('consent')
    expect(url.searchParams.get('login_hint')).toBe('me@example.com')
  })
})

describe('purpose cookie', () => {
  it('encodes and decodes the photos purpose with a safe return path', () => {
    expect(photosPurpose('/admin/albums/12')).toBe('photos|/admin/albums/12')
    expect(parsePurpose('photos|/admin/albums/12')).toEqual({
      purpose: 'photos',
      returnTo: '/admin/albums/12',
    })
  })

  it('falls back to /admin for unsafe or missing return paths', () => {
    expect(safeReturnTo('https://evil.example/')).toBe('/admin')
    expect(safeReturnTo('//evil.example')).toBe('/admin')
    expect(safeReturnTo('/login')).toBe('/admin')
    expect(safeReturnTo(null)).toBe('/admin')
    // The callback appends its own query, and `|` separates the cookie.
    expect(safeReturnTo('/admin/albums/12?x=1')).toBe('/admin')
    expect(safeReturnTo('/admin/albums/12#top')).toBe('/admin')
    expect(safeReturnTo('/admin/a|b')).toBe('/admin')
    expect(parsePurpose('photos|https://evil.example/')?.returnTo).toBe(
      '/admin',
    )
  })

  it('treats anything else as a plain sign-in', () => {
    expect(parsePurpose(undefined)).toBeNull()
    expect(parsePurpose('login|/admin')).toBeNull()
  })
})

describe('hasScope', () => {
  it('matches whole scopes in the space-separated grant', () => {
    const scope =
      'openid https://www.googleapis.com/auth/photospicker.mediaitems.readonly'
    expect(
      hasScope(
        { scope },
        'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
      ),
    ).toBe(true)
    expect(
      hasScope({ scope }, 'https://www.googleapis.com/auth/photospicker'),
    ).toBe(false)
    expect(hasScope({}, 'openid')).toBe(false)
  })
})
