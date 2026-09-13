import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { createDB } from '@/db'
import { upsertGoogleUser } from '@/db/users'
import { isAdminEmail } from '@/server/admin-allowlist'
import {
  isSecureRequest,
  parseCookies,
  serializeCookie,
} from '@/server/cookies'
import {
  exchangeCode,
  fetchUserInfo,
  googleCallbackUrl,
  OAUTH_STATE_COOKIE,
} from '@/server/google-oauth'
import { getAppSession } from '@/server/session'

type LoginError = 'oauth' | 'state' | 'not_admin' | 'unverified'

function redirectWithHeaders(request: Request, to: string): Response {
  // The session cookie written by session.update() lives in the request
  // context and is merged onto this response by TanStack Start; we only need
  // to expire the one-time state cookie here.
  const headers = new Headers()
  headers.set('location', new URL(to, request.url).toString())
  headers.append(
    'set-cookie',
    serializeCookie(OAUTH_STATE_COOKIE, '', {
      maxAge: 0,
      secure: isSecureRequest(request),
    }),
  )
  return new Response(null, { status: 302, headers })
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
        const cookies = parseCookies(request.headers.get('cookie'))

        if (url.searchParams.get('error') || !code) {
          return loginError(request, 'oauth')
        }
        if (!state || state !== cookies[OAUTH_STATE_COOKIE]) {
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

        if (!profile.email || profile.email_verified === false) {
          return loginError(request, 'unverified')
        }

        const admin = isAdminEmail(profile.email, env.ADMIN_EMAILS)
        if (!admin) {
          console.warn('Rejected non-admin sign-in:', profile.email)
          return loginError(request, 'not_admin')
        }

        const db = createDB(env.photo_album)
        const user = await upsertGoogleUser(db, {
          email: profile.email,
          sub: profile.sub,
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
