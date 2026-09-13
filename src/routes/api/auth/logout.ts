import { createFileRoute } from '@tanstack/react-router'
import { getAppSession } from '@/server/session'

/** POST-only sign out (a plain form submit from the admin bar). */
export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
