/**
 * Tiny cookie helpers for server route handlers that build their own
 * Response objects (redirects), where the request-context cookie utilities
 * do not apply.
 */

export interface CookieOptions {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${options.path ?? '/'}`)
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
  if (options.httpOnly ?? true) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  const sameSite = options.sameSite ?? 'lax'
  parts.push(`SameSite=${sameSite[0]?.toUpperCase()}${sameSite.slice(1)}`)
  return parts.join('; ')
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const name = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (name) out[name] = decodeURIComponent(value)
  }
  return out
}

/** True when the request arrived over https (so cookies can be Secure). */
export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:'
}
