import { createFileRoute } from '@tanstack/react-router'
import { getAppSession } from '@/server/session'

/**
 * Only accept the sign-out post from our own pages: the response clears the
 * session cookie regardless of whether the request carried one, so a forged
 * cross-site form post could otherwise sign the admin out.
 */
function isSameOriginRequest(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin' || site === 'none'
  const origin = request.headers.get('origin')
  return origin !== null && origin === new URL(request.url).origin
}

/** POST-only sign out (a plain form submit from the admin bar). */
export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameOriginRequest(request)) {
          return new Response('Forbidden', { status: 403 })
        }
        const session = await getAppSession()
        await session.clear()
        // Headers set via the request context (the cleared session cookie)
        // are merged onto this response by TanStack Start.
        return new Response(null, {
          status: 303,
          headers: { location: new URL('/', request.url).toString() },
        })
      },
    },
  },
})
