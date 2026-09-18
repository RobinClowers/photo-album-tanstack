import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { getCurrentAdmin } from '@/server/auth'

/** Current admin user for route guards and UI; null when signed out. */
export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => getCurrentAdmin(),
)

/**
 * Attach to every admin server function. Rejects requests without a valid
 * admin session and exposes the user as `context.user`.
 */
export const requireAdmin = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const user = await getCurrentAdmin()
    if (!user) {
      setResponseStatus(401)
      throw new Error('Unauthorized')
    }
    return next({ context: { user } })
  },
)
