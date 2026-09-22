import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Tests deliberately do NOT load the full vite.config.ts plugin chain: the
// Cloudflare plugin boots a workerd runtime that keeps the process alive after
// the run finishes, adding ~10s to every `vitest run`.
export default defineConfig({
  plugins: [viteTsConfigPaths({ projects: ['./tsconfig.json'] }), viteReact()],
  test: {
    // Worktrees under .claude/ carry their own copies of the suite.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
  },
})
