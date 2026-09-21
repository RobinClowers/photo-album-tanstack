import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import {
  deleteCookie,
  getRequestProtocol,
  setCookie,
} from '@tanstack/react-start/server'
import {
  buildAuthUrl,
  googleCallbackUrl,
  LOGIN_SCOPES,
  OAUTH_PURPOSE_COOKIE,
  OAUTH_STATE_COOKIE,
  stateCookieOptions,
} from '@/server/google-oauth'

/** Starts the Google sign-in flow: sets a state cookie and redirects. */
export const Route = createFileRoute('/api/auth/google/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const state = crypto.randomUUID()
        const location = buildAuthUrl({
          clientId: env.GOOGLE_CLIENT_ID,
          redirectUri: googleCallbackUrl(request),
          state,
          scopes: LOGIN_SCOPES,
        })
        // Cookies set on the request context are merged onto this redirect
        // response by TanStack Start.
        const options = stateCookieOptions(getRequestProtocol() === 'https')
        setCookie(OAUTH_STATE_COOKIE, state, { ...options, maxAge: 600 })
        // The callback reads the purpose cookie first, so a Google Photos
        // connection abandoned in the last ten minutes must not turn this
        // sign-in into a token store.
        deleteCookie(OAUTH_PURPOSE_COOKIE, options)
        return new Response(null, { status: 302, headers: { location } })
      },
    },
  },
})
