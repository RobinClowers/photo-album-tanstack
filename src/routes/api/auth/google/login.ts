import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { getRequestProtocol, setCookie } from '@tanstack/react-start/server'
import {
  buildAuthUrl,
  googleCallbackUrl,
  LOGIN_SCOPES,
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
        setCookie(OAUTH_STATE_COOKIE, state, {
          ...stateCookieOptions(getRequestProtocol() === 'https'),
          maxAge: 600,
        })
        return new Response(null, { status: 302, headers: { location } })
      },
    },
  },
})
