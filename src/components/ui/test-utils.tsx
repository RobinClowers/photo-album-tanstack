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
 * Computed value of a CSS property with StyleX token references
 * (`var(--hash)`) resolved against their `:root` definitions, so tests can
 * assert literal MUI values. Only whole-value `var()` references resolve.
 */
export function styleOf(element: Element, property: string): string {
  const value = getComputedStyle(element).getPropertyValue(property).trim()
  return resolveVar(element, value)
}

function resolveVar(element: Element, value: string): string {
  const name = /^var\((--[\w-]+)\)$/.exec(value)?.[1]
  if (!name) return value
  const inherited = getComputedStyle(element).getPropertyValue(name).trim()
  const root = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  return resolveVar(element, inherited || root)
}
// Note: jsdom drops shorthands whose value contains a `var()` (e.g.
// `padding: var(--x)`, `border-color: var(--x)`) entirely, so only longhands
// set from tokens (and literal shorthands) can be asserted.
