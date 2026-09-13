import { describe, expect, it } from 'vitest'
import { buildAuthUrl, GOOGLE_AUTH_URL, LOGIN_SCOPES } from './google-oauth'

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
