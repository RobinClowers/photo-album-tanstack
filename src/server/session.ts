import { env } from 'cloudflare:workers'
// Aliased: Biome's rules-of-hooks lint keys on the `use` prefix, but this is
// a server request utility, not a React hook.
import {
  getRequest,
  useSession as openSession,
} from '@tanstack/react-start/server'

export interface AppSessionData {
  userId: number
  email: string
}

const SESSION_COOKIE = 'photos_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function sessionConfig() {
  const secure = new URL(getRequest().url).protocol === 'https:'
  return {
    password: env.SESSION_SECRET,
    name: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    },
  }
}

/** Encrypted cookie session for the current request. */
export function getAppSession() {
  return openSession<AppSessionData>(sessionConfig())
}
