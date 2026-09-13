/**
 * Admin access is an allowlist of Google account emails, configured with the
 * ADMIN_EMAILS var (comma-separated) in wrangler.jsonc.
 */
export function parseAdminEmails(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email) return false
  return parseAdminEmails(allowlist).includes(email.trim().toLowerCase())
}
