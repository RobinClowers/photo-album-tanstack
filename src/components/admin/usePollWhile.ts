import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export const POLL_INTERVAL_MS = 5000

/**
 * Re-run the current route's loaders on an interval while `active`, so an
 * import's progress moves without a manual reload. Stops as soon as the
 * loader data reports nothing running.
 */
export function usePollWhile(active: boolean, intervalMs = POLL_INTERVAL_MS) {
  const router = useRouter()
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => {
      void router.invalidate()
    }, intervalMs)
    return () => clearInterval(timer)
  }, [active, intervalMs, router])
}
