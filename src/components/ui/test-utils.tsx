import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Renders `ui` inside a minimal TanStack router so router `Link`s work. The
 * router mounts asynchronously: query with `findBy*`, not `getBy*`.
 */
export function renderWithRouter(ui: ReactNode, initialPath = '/') {
  const rootRoute = createRootRoute({ component: () => ui })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  return { router, ...render(<RouterProvider router={router} />) }
}

/**
 * Computed value of a CSS property (or custom property such as a StyleX var
 * name) with StyleX token references (`var(--hash)`) resolved against the
 * element's inherited values or their `:root` definitions, so tests can
 * assert literal MUI values. Nested references, e.g. inside `color-mix()`,
 * resolve too.
 */
export function styleOf(element: Element, property: string): string {
  const value = getComputedStyle(element).getPropertyValue(property).trim()
  return resolveVars(element, value)
}

/** The custom property name behind a StyleX var, e.g. `tone.border`. */
export function varName(ref: string): string {
  const name = /^var\((--[\w-]+)\)$/.exec(ref)?.[1]
  if (!name) throw new Error(`Not a var() reference: ${ref}`)
  return name
}

/**
 * Declared value of `property` from the StyleX rule that wins for `element`
 * (ignoring @-rules and rules with pseudo-classes such as `:hover`), with
 * vars resolved. Use it where jsdom cannot compute the value, e.g.
 * `color: color-mix(in srgb, var(--x) 40%, black)`, which jsdom's CSSOM
 * drops: this reads the raw rule text recorded by vitest.setup.ts.
 */
export function declaredStyle(element: Element, property: string): string {
  const rules = (globalThis as { __rawCssRules?: string[] }).__rawCssRules ?? []
  let best: { value: string; specificity: number } | null = null
  for (const rule of rules) {
    const match = /^([^@{][^{]*)\{\s*([\w-]+)\s*:\s*([^;}]+);?\s*\}$/.exec(
      rule.trim(),
    )
    if (!match || match[2] !== property) continue
    const selector = (match[1] as string).trim()
    if (selector.replace(/:not\(#\\#\)/g, '').includes(':')) continue
    if (!element.matches(selector)) continue
    const specificity = selector.split(':not(#').length
    if (!best || specificity >= best.specificity) {
      best = { value: (match[3] as string).trim(), specificity }
    }
  }
  const found = best as { value: string } | null
  return found ? resolveVars(element, found.value) : ''
}

function resolveVars(element: Element, value: string, depth = 0): string {
  if (depth > 10) return value
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const inherited = getComputedStyle(element).getPropertyValue(name).trim()
    const root = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()
    return resolveVars(element, inherited || root, depth + 1)
  })
}
// Note: jsdom drops shorthands whose value contains a `var()` (e.g.
// `padding: var(--x)`, `border-color: var(--x)`) entirely, so only longhands
// set from tokens (and literal shorthands) can be asserted.
