import {
  type AnyRoute,
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

export interface RenderRouteOptions {
  /** Route id as in routeTree.gen.ts, e.g. `/albums/$slug_/$filename`. */
  id: string
  /** Route path as in routeTree.gen.ts, e.g. `/albums/$slug/$filename`. */
  path: string
  /** URL to open, e.g. `/albums/trip/a.jpg?x=1`. */
  url: string
  /** What the loader resolves to; replaces the real (server) loader. */
  loaderData?: unknown
}

/**
 * Renders a file route's page component in a minimal router, the way
 * routeTree.gen.ts mounts it (same id and path, so `Route.useLoaderData()`,
 * `useParams()` and `useSearch()` work), with a stub loader and without the
 * route's `beforeLoad` guard. Mock the route's server-function imports with
 * `vi.mock` first. The router mounts asynchronously: query with `findBy*`.
 */
export function renderRoute(
  route: AnyRoute,
  { id, path, url, loaderData }: RenderRouteOptions,
) {
  // The router resets scroll on navigation; jsdom logs "Not implemented".
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const rootRoute = createRootRoute()
  // `update` is typed for options only; routeTree.gen.ts passes id / path /
  // getParentRoute through it the same way (with an `as any`).
  const pageRoute = route.update({
    id,
    path,
    getParentRoute: () => rootRoute,
    beforeLoad: undefined,
    loader: () => loaderData,
  } as Parameters<AnyRoute['update']>[0])
  const router = createRouter({
    routeTree: rootRoute.addChildren([pageRoute]),
    history: createMemoryHistory({ initialEntries: [url] }),
  })
  return { router, ...render(<RouterProvider router={router} />) }
}
