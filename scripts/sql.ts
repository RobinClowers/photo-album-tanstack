/**
 * Split a SQL script into statements for `cf d1 raw --batch`, which (unlike
 * wrangler's `d1 execute --file`) takes statements, not a file. Semicolons
 * inside quotes, identifiers and comments do not split, and a CREATE TRIGGER
 * body runs to its END. Comments are dropped.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let i = 0

  const push = () => {
    const statement = current.trim()
    if (statement) statements.push(statement)
    current = ''
  }

  while (i < sql.length) {
    const char = sql[i] as string
    const next = sql[i + 1]

    if (char === '-' && next === '-') {
      const end = sql.indexOf('\n', i)
      i = end === -1 ? sql.length : end + 1
      current += '\n'
      continue
    }
    if (char === '/' && next === '*') {
      const end = sql.indexOf('*/', i + 2)
      i = end === -1 ? sql.length : end + 2
      current += ' '
      continue
    }
    const close =
      char === "'" || char === '"' || char === '`'
        ? char
        : char === '['
          ? ']'
          : null
    if (close) {
      // SQLite escapes a quote by doubling it, which this loop handles as
      // two adjacent quoted runs.
      const end = sql.indexOf(close, i + 1)
      const stop = end === -1 ? sql.length : end + 1
      current += sql.slice(i, stop)
      i = stop
      continue
    }
    if (char === ';') {
      current += ';'
      i++
      if (/^\s*create\s+(temp\s+|temporary\s+)?trigger\b/i.test(current)) {
        if (!/\bend\s*;$/i.test(current.trimEnd())) continue
      }
      push()
      continue
    }
    current += char
    i++
  }
  push()
  return statements
}

/** Group statements into batches of at most `maxBytes` of SQL each. */
export function batchStatements(
  statements: string[],
  maxBytes: number,
): string[][] {
  const batches: string[][] = []
  let batch: string[] = []
  let size = 0
  for (const statement of statements) {
    const bytes = Buffer.byteLength(statement)
    if (batch.length > 0 && size + bytes > maxBytes) {
      batches.push(batch)
      batch = []
      size = 0
    }
    batch.push(statement)
    size += bytes
  }
  if (batch.length > 0) batches.push(batch)
  return batches
}
