import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { getRequestProtocol, setCookie } from '@tanstack/react-start/server'
import { getCurrentAdmin } from '@/server/auth'
import {
  buildAuthUrl,
  googleCallbackUrl,
  LOGIN_SCOPES,
  OAUTH_PURPOSE_COOKIE,
  OAUTH_STATE_COOKIE,
  photosPurpose,
  stateCookieOptions,
} from '@/server/google-oauth'
import { PICKER_SCOPE } from '@/server/google-photos'

/**
 * Incremental authorization for Google Photos: asks the signed-in admin for
 * the Picker scope (plus offline access so imports can outlive the hour-long
 * access token) and returns them to `returnTo` afterwards. Reuses the
 * sign-in callback, which reads the purpose cookie to tell the two flows
 * apart, so no extra redirect URI has to be registered with Google.
 */
export const Route = createFileRoute('/api/auth/google/photos')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin = await getCurrentAdmin()
        if (!admin) {
          return new Response(null, {
            status: 302,
            headers: { location: '/login' },
          })
        }
        const returnTo = new URL(request.url).searchParams.get('returnTo')
        const state = crypto.randomUUID()
        const location = buildAuthUrl({
          clientId: env.GOOGLE_CLIENT_ID,
          redirectUri: googleCallbackUrl(request),
          state,
          scopes: [...LOGIN_SCOPES, PICKER_SCOPE],
          offline: true,
          // Without prompt=consent Google only issues a refresh token the
          // first time; forcing it makes reconnecting after a revocation work.
          forceConsent: true,
          loginHint: admin.email,
        })
        const cookie = {
          ...stateCookieOptions(getRequestProtocol() === 'https'),
          maxAge: 600,
        }
        setCookie(OAUTH_STATE_COOKIE, state, cookie)
        setCookie(OAUTH_PURPOSE_COOKIE, photosPurpose(returnTo), cookie)
        return new Response(null, { status: 302, headers: { location } })
      },
    },
  },
})
