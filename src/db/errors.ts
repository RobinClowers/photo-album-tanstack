/**
 * Drizzle wraps driver failures in a DrizzleQueryError whose own message is
 * the failed SQL and its params; the SQLite text ("UNIQUE constraint failed:
 * albums.title: SQLITE_CONSTRAINT" on D1) is on `cause`, one or more levels
 * down depending on the driver.
 */
const MAX_CAUSE_DEPTH = 5

function messages(err: unknown): string[] {
  const out: string[] = []
  let current: unknown = err
  for (let depth = 0; current && depth < MAX_CAUSE_DEPTH; depth++) {
    out.push(current instanceof Error ? current.message : String(current))
    current = current instanceof Error ? current.cause : undefined
  }
  return out
}

/**
 * The column list of the UNIQUE constraint an error reports, e.g.
 * "albums.slug" or "photos.path, photos.filename", or null when the error is
 * not a uniqueness failure.
 */
export function uniqueConstraintColumns(err: unknown): string | null {
  for (const message of messages(err)) {
    const match =
      /UNIQUE constraint failed: (.+?)(?::\s*SQLITE_CONSTRAINT|\n|$)/.exec(
        message,
      )
    if (match?.[1]) return match[1].trim()
  }
  return null
}
