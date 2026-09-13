import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { isSecureRequest, serializeCookie } from '@/server/cookies'
import {
  buildAuthUrl,
  googleCallbackUrl,
  LOGIN_SCOPES,
  OAUTH_STATE_COOKIE,
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
        return new Response(null, {
          status: 302,
          headers: {
            location,
            'set-cookie': serializeCookie(OAUTH_STATE_COOKIE, state, {
              maxAge: 600,
              secure: isSecureRequest(request),
            }),
          },
        })
      },
    },
  },
})
