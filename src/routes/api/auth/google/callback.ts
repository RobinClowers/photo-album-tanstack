import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import {
  deleteCookie,
  getCookie,
  getRequestProtocol,
} from '@tanstack/react-start/server'
import { createDB } from '@/db'
import { upsertGoogleUser } from '@/db/users'
import { isAdminEmail, normalizeEmail } from '@/server/admin-allowlist'
import {
  exchangeCode,
  fetchUserInfo,
  googleCallbackUrl,
  OAUTH_STATE_COOKIE,
  stateCookieOptions,
} from '@/server/google-oauth'
import { getAppSession } from '@/server/session'
import type { LoginError } from '@/utils/loginErrors'

function redirectWithHeaders(request: Request, to: string): Response {
  // Cookies written to the request context (the session cookie from
  // session.update(), plus the expired state cookie below) are merged onto
  // this response by TanStack Start.
  deleteCookie(
    OAUTH_STATE_COOKIE,
    stateCookieOptions(getRequestProtocol() === 'https'),
  )
  return new Response(null, {
    status: 302,
    headers: { location: new URL(to, request.url).toString() },
  })
}

function loginError(request: Request, error: LoginError): Response {
  return redirectWithHeaders(request, `/login?error=${error}`)
}

/** Google redirects here after consent. */
export const Route = createFileRoute('/api/auth/google/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')

        if (url.searchParams.get('error') || !code) {
          return loginError(request, 'oauth')
        }
        if (!state || state !== getCookie(OAUTH_STATE_COOKIE)) {
          return loginError(request, 'state')
        }

        let profile: Awaited<ReturnType<typeof fetchUserInfo>>
        try {
          const tokens = await exchangeCode({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            code,
            redirectUri: googleCallbackUrl(request),
          })
          profile = await fetchUserInfo(tokens.access_token)
        } catch (error) {
          console.error('Google sign-in failed:', error)
          return loginError(request, 'oauth')
        }

        // The userinfo response is untyped JSON: check the claims we rely on
        // rather than trusting the type assertion.
        const sub = profile.sub
        if (typeof sub !== 'string' || sub === '') {
          console.error('Google userinfo response had no subject claim')
          return loginError(request, 'oauth')
        }
        // A missing email_verified claim is not a verified email.
        if (
          typeof profile.email !== 'string' ||
          profile.email === '' ||
          profile.email_verified !== true
        ) {
          return loginError(request, 'unverified')
        }

        const email = normalizeEmail(profile.email)
        const admin = isAdminEmail(email, env.ADMIN_EMAILS)
        if (!admin) {
          // Domain only: any visitor can reach this, and their full address
          // does not belong in the Workers logs.
          console.warn(
            'Rejected non-admin sign-in from domain:',
            email.split('@')[1] ?? 'unknown',
          )
          return loginError(request, 'not_admin')
        }

        const db = createDB(env.photo_album)
        const user = await upsertGoogleUser(db, {
          email,
          sub,
          name: profile.name ?? null,
          admin,
        })

        const session = await getAppSession()
        await session.update({ userId: user.id, email: user.email })

        return redirectWithHeaders(request, '/admin')
      },
    },
  },
})
