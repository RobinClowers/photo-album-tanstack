/**
 * Stand-in for Vite's `/@react-refresh` virtual module, used only while
 * Pigment CSS evaluates `sx` props at dev time. See pigmentReactRefresh.ts.
 * The real runtime is still what the browser loads.
 */
type Noop = (...args: unknown[]) => void

const noop: Noop = () => {}

export const register: Noop = noop
export const registerExportsForReactRefresh: Noop = noop
export const validateRefreshBoundaryAndEnqueueUpdate = (): null => null
export const createSignatureFunctionForTransform = (): Noop => noop
export const __hmr_import = (): Promise<Record<string, unknown>> =>
  Promise.resolve({})
