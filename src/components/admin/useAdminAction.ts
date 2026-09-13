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
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      setPending(true)
      setError(null)
      try {
        const result = await action()
        await router.invalidate()
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        return undefined
      } finally {
        setPending(false)
      }
    },
    [router],
  )

  const clearError = useCallback(() => setError(null), [])

  return { run, pending, error, clearError }
}
