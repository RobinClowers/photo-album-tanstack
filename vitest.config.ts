import stylex from '@stylexjs/unplugin'
import viteReact from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { stylexAliases } from './vite/stylex'

/**
 * Compiles stylex.create / defineVars like the app build does, but injects the
 * generated rules into the jsdom document at runtime so tests can assert
 * computed styles. No CSS layers: jsdom's cascade does not understand @layer.
 */
function stylexForTests(): Plugin {
  const plugin: Plugin = stylex.vite({
    dev: true,
    runtimeInjection: true,
    useCSSLayers: false,
    aliases: stylexAliases,
  })
  // The plugin's configureServer starts a polling interval that is only
  // cleared when an HTTP server closes. Vitest has none, so the run would
  // hang for 10s on exit. Tests do not need its dev CSS middleware anyway.
  const { configureServer: _devServerOnly, ...rest } = plugin
  return rest
}

// Tests deliberately do NOT load the full vite.config.ts plugin chain: the
// Cloudflare plugin boots a workerd runtime that keeps the process alive after
// the run finishes, adding ~10s to every `vitest run`.
export default defineConfig({
  plugins: [
    stylexForTests(),
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    viteReact(),
  ],
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // Worktrees under .claude/ carry their own copies of the suite.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
})
