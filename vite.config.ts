import { cloudflare } from '@cloudflare/vite-plugin'
import { createTheme } from '@mui/material'
import { pigment } from '@pigment-css/vite-plugin'
import stylex from '@stylexjs/unplugin'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { pigmentWithReactRefresh } from './vite/pigmentReactRefresh'
import { stylexAliases } from './vite/stylex'

const config = defineConfig({
  plugins: [
    pigmentWithReactRefresh(
      pigment({
        transformLibraries: ['@mui/material'],
        theme: createTheme({
          cssVariables: true,
        }),
      }),
    ),
    stylex.vite({
      // StyleX output goes in CSS @layers, declared after the `reset` layer
      // that app.css uses, so StyleX beats the base styles regardless of which
      // stylesheet loads first. Unlayered CSS (MUI/Pigment) beats every layer,
      // so never put StyleX styles on MUI components.
      useCSSLayers: { before: ['reset'] },
      devPersistToDisk: true,
      aliases: stylexAliases,
    }),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
