import { fileURLToPath } from 'node:url'

/**
 * StyleX resolves `.stylex.ts` imports itself (for `defineVars` /
 * `defineConsts`), so it needs the tsconfig `@/*` alias too; vite-tsconfig-paths
 * alone is not enough. Shared by vite.config.ts and vitest.config.ts.
 */
export const stylexAliases = {
  '@/*': [fileURLToPath(new URL('../src/*', import.meta.url))],
}
