/**
 * Minimal CSS scanning for the layer-order tests: enough to split a stylesheet
 * into top-level statements, not a general CSS parser.
 */

/**
 * Splits a stylesheet into its top-level statements (rules, at-rule blocks
 * and `;`-terminated at-rules), with comments removed and whitespace trimmed.
 */
export function topLevelStatements(css: string): string[] {
  const statements: string[] = []
  let depth = 0
  let start = 0
  let i = 0
  const push = (end: number) => {
    const text = css
      .slice(start, end)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim()
    if (text) statements.push(text)
    start = end
  }
  while (i < css.length) {
    const ch = css[i]
    if (ch === '/' && css[i + 1] === '*') {
      const close = css.indexOf('*/', i + 2)
      i = close === -1 ? css.length : close + 2
      continue
    }
    if (ch === '"' || ch === "'") {
      i += 1
      while (i < css.length && css[i] !== ch) i += css[i] === '\\' ? 2 : 1
      i += 1
      continue
    }
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        push(i + 1)
      }
    } else if (ch === ';' && depth === 0) {
      push(i + 1)
    }
    i += 1
  }
  push(css.length)
  return statements
}

const LAYER_RE = /^@layer\s+([^{;]+?)\s*[{;]/

/** Layer names in the order they are first declared, which sets precedence. */
export function layerOrder(statements: string[]): string[] {
  const order: string[] = []
  for (const statement of statements) {
    const match = LAYER_RE.exec(statement)
    if (!match?.[1]) continue
    for (const name of match[1].split(',').map((n) => n.trim())) {
      if (!order.includes(name)) order.push(name)
    }
  }
  return order
}

/**
 * Top-level statements that put styles outside any cascade layer: everything
 * except `@layer` statements and `@charset`. (A plain `@import` counts as
 * unlayered, since the imported rules land outside every layer.)
 */
export function unlayeredStatements(statements: string[]): string[] {
  return statements.filter((s) => !LAYER_RE.test(s) && !/^@charset\b/.test(s))
}

/**
 * The non-custom properties a statement declares, e.g. `['color']` for
 * `.a{--x:1;color:red}`. `@property` and `@keyframes` declare none: they
 * register names rather than style elements.
 */
export function nonCustomProperties(statement: string): string[] {
  if (/^@(property|keyframes)\b/.test(statement)) return []
  const properties: string[] = []
  // Innermost `{...}` bodies are declaration blocks.
  for (const [, body = ''] of statement.matchAll(/\{([^{}]*)\}/g)) {
    for (const declaration of body.split(';')) {
      const name = declaration.split(':')[0]?.trim()
      if (name && !name.startsWith('--')) properties.push(name)
    }
  }
  return properties
}
