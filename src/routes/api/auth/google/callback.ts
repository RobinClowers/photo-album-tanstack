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
import { getCurrentAdmin } from '@/server/auth'
import { storeGoogleTokens } from '@/server/google-auth'
import {
  exchangeCode,
  fetchUserInfo,
  googleCallbackUrl,
  hasScope,
  OAUTH_PURPOSE_COOKIE,
  OAUTH_STATE_COOKIE,
  parsePurpose,
  stateCookieOptions,
} from '@/server/google-oauth'
import { PICKER_SCOPE } from '@/server/google-photos'
import { getAppSession } from '@/server/session'
import type { LoginError } from '@/utils/loginErrors'

function redirectWithHeaders(request: Request, to: string): Response {
  // Cookies written to the request context (the session cookie from
  // session.update(), plus the expired one-time cookies below) are merged
  // onto this response by TanStack Start.
  const options = stateCookieOptions(getRequestProtocol() === 'https')
  deleteCookie(OAUTH_STATE_COOKIE, options)
  deleteCookie(OAUTH_PURPOSE_COOKIE, options)
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
        const purpose = parsePurpose(getCookie(OAUTH_PURPOSE_COOKIE))

        if (url.searchParams.get('error') || !code) {
          if (purpose) {
            return redirectWithHeaders(
              request,
              `${purpose.returnTo}?google=denied`,
            )
          }
          return loginError(request, 'oauth')
        }
        if (!state || state !== getCookie(OAUTH_STATE_COOKIE)) {
          return loginError(request, 'state')
        }

        let tokens: Awaited<ReturnType<typeof exchangeCode>>
        let profile: Awaited<ReturnType<typeof fetchUserInfo>>
        try {
          tokens = await exchangeCode({
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

        // Connecting Google Photos for the already signed-in admin: keep the
        // tokens, no session changes. The grant must be for the same Google
        // account as the session and must actually include the Picker scope
        // (the consent screen lets the user untick it).
        if (purpose?.purpose === 'photos') {
          const admin = await getCurrentAdmin()
          if (!admin) return loginError(request, 'oauth')
          const email =
            typeof profile.email === 'string'
              ? normalizeEmail(profile.email)
              : ''
          if (email !== normalizeEmail(admin.email)) {
            return redirectWithHeaders(
              request,
              `${purpose.returnTo}?google=wrong_account`,
            )
          }
          if (!hasScope(tokens, PICKER_SCOPE)) {
            return redirectWithHeaders(
              request,
              `${purpose.returnTo}?google=denied`,
            )
          }
          await storeGoogleTokens(createDB(env.photo_album), admin.id, tokens)
          return redirectWithHeaders(
            request,
            `${purpose.returnTo}?google=connected`,
          )
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
