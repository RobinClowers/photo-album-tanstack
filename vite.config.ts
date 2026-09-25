import { cloudflare } from '@cloudflare/vite-plugin'
import stylex from '@stylexjs/unplugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { stylexBuildOptions } from './vite/stylex'

const config = defineConfig({
  plugins: [
    stylex.vite({ ...stylexBuildOptions, devPersistToDisk: true }),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      // Route tests sit beside the routes (src/routes/login.test.tsx); they
      // are not routes.
      router: { routeFileIgnorePattern: '\\.test\\.tsx?$' },
    }),
    viteReact(),
  ],
})

export default config
