import { useRouter } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

/**
 * Runs an admin mutation, refreshes route data afterwards, and surfaces the
 * error message for a Snackbar. One pending flag per hook instance.
 */
export function useAdminAction() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async <T>(
      action: () => Promise<T>,
      options?: { trackPending?: boolean },
    ): Promise<T | undefined> => {
      // Opt out for actions that must not disable the rest of the page, e.g. a
      // caption saved on blur: the pending flag would land before the click
      // that caused the blur and swallow it.
      const track = options?.trackPending !== false
      if (track) setPending(true)
      setError(null)
      try {
        const result = await action()
        await router.invalidate()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // The session expired mid-edit; a Snackbar would just sit there.
        if (message === 'Unauthorized') {
          router.navigate({ to: '/login' })
        } else {
          setError(message)
        }
        return undefined
      } finally {
        if (track) setPending(false)
      }
    },
    [router],
  )

  const clearError = useCallback(() => setError(null), [])

  return { run, pending, error, clearError }
}
