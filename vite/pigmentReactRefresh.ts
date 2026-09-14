import { fileURLToPath } from 'node:url'
import type { Plugin, PluginOption } from 'vite'

const REACT_REFRESH_ID = '/@react-refresh'
const STUB_PATH = fileURLToPath(
  new URL('./react-refresh-stub.ts', import.meta.url),
)

/**
 * Dev-only workaround for Pigment CSS + React Fast Refresh.
 *
 * `@vitejs/plugin-react` runs at `enforce: 'pre'` and appends
 * `import * as RefreshRuntime from "/@react-refresh"` plus `$RefreshSig$()`
 * calls to every client component module. Pigment's WyW-in-JS evaluator runs
 * at `enforce: 'post'`, so it sees that code, follows the import while
 * evaluating `sx` props, and tries to read `/@react-refresh` from disk,
 * which fails the whole transform. Public components escape only because
 * WyW caches per file and happens to see the SSR transform (which has no
 * refresh code) first; the client-only `/admin` tree (`ssr: false`) always
 * hit the error.
 *
 * Wrapping the Pigment transform lets WyW resolve `/@react-refresh` to a
 * tiny stub file instead. Vite's own resolution of the virtual module, and
 * therefore Fast Refresh in the browser, is untouched.
 */
export function pigmentWithReactRefresh(
  plugins: PluginOption[],
): PluginOption[] {
  let wrappedAny = false
  for (const plugin of plugins) {
    if (!plugin || Array.isArray(plugin) || !('name' in plugin)) continue
    if (plugin.name !== 'vite-plugin-zero-runtime') continue
    const original = plugin.transform
    if (typeof original !== 'function') continue
    wrappedAny = true

    type Transform = NonNullable<Plugin['transform']>
    const wrapped: Transform = function (this, ...args) {
      const context = new Proxy(this, {
        get(target, prop) {
          if (prop === 'resolve') {
            return (source: string, ...rest: unknown[]) =>
              source === REACT_REFRESH_ID
                ? Promise.resolve({ id: STUB_PATH, external: false })
                : Reflect.apply(target.resolve, target, [source, ...rest])
          }
          const value = Reflect.get(target, prop, target)
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
      return Reflect.apply(original, context, args)
    }
    plugin.transform = wrapped
  }
  if (!wrappedAny) {
    throw new Error(
      'pigmentWithReactRefresh found no "vite-plugin-zero-runtime" plugin with a function-form transform to wrap. Pigment CSS probably changed its plugin name or transform shape: re-check the /admin dev server (ssr: false) for the "/@react-refresh" resolve error before removing this workaround.',
    )
  }
  return plugins
}
