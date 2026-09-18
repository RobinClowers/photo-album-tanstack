import { env } from 'cloudflare:workers'
import type { DB } from '@/db'
import {
  deleteGoogleAuthorization,
  type GoogleTokens,
  getGoogleAuthorization,
  upsertGoogleAuthorization,
} from '@/db/google-auth'
import {
  GoogleOAuthError,
  refreshAccessToken,
  type TokenResponse,
} from './google-oauth'
import { PICKER_SCOPE } from './google-photos'
import { importTokenKey, open, seal } from './token-crypto'

/** Refresh when the access token has less than this long left. */
const REFRESH_MARGIN_MS = 60_000

let key: Promise<CryptoKey> | undefined
function tokenKey(): Promise<CryptoKey> {
  key ??= importTokenKey(env.TOKEN_ENCRYPTION_KEY)
  return key
}

export function expiresAtFrom(tokens: TokenResponse, now = Date.now()): string {
  return new Date(now + tokens.expires_in * 1000).toISOString()
}

/**
 * Persist a token response for a user, keeping the previous refresh token
 * when Google did not send a new one (it only does on the first consent).
 */
export async function storeGoogleTokens(
  db: DB,
  userId: number,
  tokens: TokenResponse,
): Promise<void> {
  const previous = await readTokens(db, userId)
  const refreshToken = tokens.refresh_token ?? previous?.refreshToken ?? null
  const blob: GoogleTokens = {
    accessToken: tokens.access_token,
    refreshToken,
    expiresAt: expiresAtFrom(tokens),
  }
  await upsertGoogleAuthorization(db, {
    userId,
    scope: tokens.scope ?? PICKER_SCOPE,
    encryptedTokens: await seal(await tokenKey(), JSON.stringify(blob)),
    expiresAt: blob.expiresAt,
  })
}

async function readTokens(
  db: DB,
  userId: number,
): Promise<GoogleTokens | null> {
  const row = await getGoogleAuthorization(db, userId)
  if (!row) return null
  try {
    return JSON.parse(await open(await tokenKey(), row.encryptedTokens))
  } catch (error) {
    // A rotated key or corrupt row: treat as not connected so the admin is
    // asked to reconnect instead of every import failing opaquely.
    console.warn(`[google] could not open tokens for user ${userId}:`, error)
    return null
  }
}

export type GoogleConnection =
  | {
      status: 'connected'
      scope: string
      expiresAt: string
      canRefresh: boolean
    }
  | { status: 'disconnected' }

export async function getGoogleConnection(
  db: DB,
  userId: number,
): Promise<GoogleConnection> {
  const row = await getGoogleAuthorization(db, userId)
  if (!row?.scope.split(/\s+/).includes(PICKER_SCOPE)) {
    return { status: 'disconnected' }
  }
  const tokens = await readTokens(db, userId)
  if (!tokens) return { status: 'disconnected' }
  return {
    status: 'connected',
    scope: row.scope,
    expiresAt: tokens.expiresAt,
    canRefresh: tokens.refreshToken !== null,
  }
}

export class GoogleReauthRequired extends Error {
  constructor(
    message = 'Google Photos access has expired; reconnect to continue',
  ) {
    super(message)
    this.name = 'GoogleReauthRequired'
  }
}

/**
 * An access token good for at least a minute, refreshing (and re-sealing)
 * when needed. Throws GoogleReauthRequired when there is nothing to refresh
 * with or Google rejects the refresh token.
 */
export async function getValidAccessToken(
  db: DB,
  userId: number,
): Promise<string> {
  const tokens = await readTokens(db, userId)
  if (!tokens) throw new GoogleReauthRequired()
  if (new Date(tokens.expiresAt).getTime() - Date.now() > REFRESH_MARGIN_MS) {
    return tokens.accessToken
  }
  if (!tokens.refreshToken) throw new GoogleReauthRequired()
  try {
    const refreshed = await refreshAccessToken({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      refreshToken: tokens.refreshToken,
    })
    await storeGoogleTokens(db, userId, refreshed)
    return refreshed.access_token
  } catch (error) {
    if (error instanceof GoogleOAuthError && error.status === 400) {
      // invalid_grant: revoked, or the 7-day expiry of a Testing-status app.
      await deleteGoogleAuthorization(db, userId)
      throw new GoogleReauthRequired()
    }
    throw error
  }
}
