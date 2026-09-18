/**
 * Admin access is an allowlist of Google account emails, configured with the
 * ADMIN_EMAILS var (comma-separated) in wrangler.jsonc.
 */

/**
 * Emails are compared and stored in this form, so a differently-cased Google
 * account still matches the allowlist and the existing user row.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function parseAdminEmails(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter(Boolean)
}

export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email) return false
  return parseAdminEmails(allowlist).includes(normalizeEmail(email))
}
