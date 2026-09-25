import { fileURLToPath } from 'node:url'
import type { UserOptions } from '@stylexjs/unplugin'

/**
 * StyleX resolves `.stylex.ts` imports itself (for `defineVars` /
 * `defineConsts`), so it needs the tsconfig `@/*` alias too; vite-tsconfig-paths
 * alone is not enough. Shared by vite.config.ts and vitest.config.ts.
 */
export const stylexAliases = {
  '@/*': [fileURLToPath(new URL('../src/*', import.meta.url))],
}

/**
 * The CSS layer names src/styles/app.css puts its global base styles in.
 * StyleX declares these ahead of its own layers.
 */
export const BASE_CSS_LAYERS = ['reset'] as const

/**
 * StyleX options for the app build. StyleX output goes in CSS @layers,
 * declared after the base layers app.css uses, so any StyleX style beats the
 * base styles regardless of which stylesheet loads first. Unlayered global CSS
 * would beat every StyleX rule; src/styles/layers.test.ts builds with these
 * options and fails if either guarantee breaks.
 */
export const stylexBuildOptions = {
  useCSSLayers: { before: BASE_CSS_LAYERS },
  aliases: stylexAliases,
} satisfies Partial<UserOptions>
