import { env } from 'cloudflare:workers'
// Aliased: Biome's rules-of-hooks lint keys on the `use` prefix, but this is
// a server request utility, not a React hook.
import {
  getCookie,
  getRequestProtocol,
  useSession as openSession,
} from '@tanstack/react-start/server'

export interface AppSessionData {
  userId: number
  email: string
}

export const SESSION_COOKIE = 'photos_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
/** The seal key derivation refuses anything shorter. */
const MIN_SECRET_LENGTH = 32

function sessionPassword(): string {
  const secret = env.SESSION_SECRET
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters (see wrangler secrets)`,
    )
  }
  return secret
}

export function sessionConfig() {
  return {
    password: sessionPassword(),
    name: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
    // Cookie only: do not accept a session from the x-photos_session-session
    // request header.
    sessionHeader: false as const,
    cookie: {
      httpOnly: true,
      secure: getRequestProtocol() === 'https',
      sameSite: 'lax' as const,
      path: '/',
    },
  }
}

/**
 * True when the request carries a session cookie. Opening a session mints a
 * brand new one (and sets the cookie) when none exists, so callers that only
 * want to read an existing session must check this first.
 */
export function hasSessionCookie(): boolean {
  return getCookie(SESSION_COOKIE) !== undefined
}

/** Encrypted cookie session for the current request. */
export function getAppSession() {
  return openSession<AppSessionData>(sessionConfig())
}
