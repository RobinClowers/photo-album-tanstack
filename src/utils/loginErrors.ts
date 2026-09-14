/**
 * Reasons the Google sign-in flow can bounce back to `/login?error=…`.
 * Shared by the callback handler that writes them and the login page that
 * renders them, so `?error=` can never be an arbitrary string.
 */
export const LOGIN_ERRORS = [
  'oauth',
  'state',
  'not_admin',
  'unverified',
] as const

export type LoginError = (typeof LOGIN_ERRORS)[number]

/** Narrows a user-supplied `?error=` value, dropping anything unknown. */
export function parseLoginError(value: unknown): LoginError | undefined {
  return LOGIN_ERRORS.find((error) => error === value)
}
