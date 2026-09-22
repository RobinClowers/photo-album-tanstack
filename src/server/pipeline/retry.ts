/**
 * Retry policy for import items. Kept free of Worker imports so it can be
 * unit tested; the queue consumer applies it.
 */

/** Attempts per item before it is marked failed for the admin to retry. */
export const MAX_ATTEMPTS = 4

/** 30 s, 60 s, 120 s... capped at ten minutes. */
export function retryDelaySeconds(attempt: number): number {
  return Math.min(600, 30 * 2 ** Math.max(0, attempt - 1))
}
