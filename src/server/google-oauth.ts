/**
 * Minimal Google OAuth 2.0 / OpenID Connect client built on fetch.
 * Pure functions with no environment access so they are easy to unit test.
 */

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
export const GOOGLE_USERINFO_URL =
  'https://openidconnect.googleapis.com/v1/userinfo'

/** Scopes needed to identify the signed-in account. */
export const LOGIN_SCOPES = ['openid', 'email', 'profile'] as const

export interface AuthUrlOptions {
  clientId: string
  redirectUri: string
  state: string
  scopes: readonly string[]
  /** Request a refresh token (offline access). */
  offline?: boolean
  /** Force the consent screen even if already granted. */
  forceConsent?: boolean
  /** Pre-select the account matching this email. */
  loginHint?: string
}

export function buildAuthUrl(options: AuthUrlOptions): string {
  const url = new URL(GOOGLE_AUTH_URL)
  url.searchParams.set('client_id', options.clientId)
  url.searchParams.set('redirect_uri', options.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', options.scopes.join(' '))
  url.searchParams.set('state', options.state)
  url.searchParams.set('include_granted_scopes', 'true')
  if (options.offline) url.searchParams.set('access_type', 'offline')
  if (options.forceConsent) url.searchParams.set('prompt', 'consent')
  if (options.loginHint) url.searchParams.set('login_hint', options.loginHint)
  return url.toString()
}

export interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
  refresh_token?: string
  id_token?: string
}

export class GoogleOAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message)
    this.name = 'GoogleOAuthError'
  }
}

export async function exchangeCode(params: {
  clientId: string
  clientSecret: string
  code: string
  redirectUri: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    throw new GoogleOAuthError(
      'Google token exchange failed',
      res.status,
      await res.text(),
    )
  }
  return (await res.json()) as TokenResponse
}

/**
 * Trade a refresh token for a new access token. Google does not rotate the
 * refresh token here, so the caller keeps the old one. A revoked or expired
 * grant comes back as a 400 `invalid_grant`, surfaced as GoogleOAuthError.
 */
export async function refreshAccessToken(params: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    throw new GoogleOAuthError(
      'Google token refresh failed',
      res.status,
      await res.text(),
    )
  }
  return (await res.json()) as TokenResponse
}

/** Whether a token response granted a given scope. */
export function hasScope(tokens: { scope?: string }, scope: string): boolean {
  return (tokens.scope ?? '').split(/\s+/).includes(scope)
}

export interface GoogleUserInfo {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

export async function fetchUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new GoogleOAuthError(
      'Google userinfo request failed',
      res.status,
      await res.text(),
    )
  }
  return (await res.json()) as GoogleUserInfo
}

/** Name of the one-time CSRF state cookie used during sign-in. */
export const OAUTH_STATE_COOKIE = 'oauth_state'

/**
 * Attributes for the state cookie. Shared by the login and callback handlers
 * so the browser matches the same cookie when it is cleared. SameSite=Lax so
 * it survives Google's top-level redirect back to the callback.
 */
export function stateCookieOptions(secure: boolean) {
  return {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
  }
}

/**
 * Second one-time cookie naming what the OAuth round trip is for. Absent for
 * plain sign-in; `photos|<returnTo>` for the Google Photos connection.
 */
export const OAUTH_PURPOSE_COOKIE = 'oauth_purpose'

const PHOTOS_PURPOSE = 'photos'

/** Only admin-relative paths are accepted as a return target. */
export function safeReturnTo(value: string | null | undefined): string {
  return value && /^\/admin(\/[^\s]*)?$/.test(value) ? value : '/admin'
}

export function photosPurpose(returnTo: string | null | undefined): string {
  return `${PHOTOS_PURPOSE}|${safeReturnTo(returnTo)}`
}

/** Parse the purpose cookie; null means an ordinary sign-in. */
export function parsePurpose(
  cookie: string | undefined,
): { purpose: 'photos'; returnTo: string } | null {
  if (!cookie) return null
  const [purpose, returnTo] = cookie.split('|', 2)
  if (purpose !== PHOTOS_PURPOSE) return null
  return { purpose: 'photos', returnTo: safeReturnTo(returnTo) }
}

/** Absolute callback URL for the current origin (registered in Google). */
export function googleCallbackUrl(request: Request): string {
  return new URL('/api/auth/google/callback', request.url).toString()
}
