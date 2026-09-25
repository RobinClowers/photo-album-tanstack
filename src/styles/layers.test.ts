// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylex from '@stylexjs/unplugin'
import viteReact from '@vitejs/plugin-react'
import { build, type Rollup } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  layerOrder,
  nonCustomProperties,
  topLevelStatements,
  unlayeredStatements,
} from '@/test/cssStatements'
import { stylexBuildOptions } from '../../vite/stylex'

/*
 * jsdom has no CSS cascade layers, so the layer order cannot be checked by
 * rendering. Instead these tests build app.css plus every UI primitive with
 * the app's own StyleX options and inspect the emitted stylesheet.
 *
 * What must hold: the `reset` layer (app.css) is declared before every StyleX
 * layer, so any StyleX class beats the base styles; and no unlayered rule sets
 * a regular property, because an unlayered rule beats every layer.
 *
 * StyleX itself leaves its priority-0 output unlayered by design: defineVars
 * `:root` blocks, var overrides from stylex.create (`[vars.x]: ...`),
 * `@property` and `@keyframes`. Those only set custom properties or register
 * names, so they cannot outrank a layered style.
 */

const SRC = fileURLToPath(new URL('..', import.meta.url))
const APP_CSS = join(SRC, 'styles/app.css')

describe('app.css', () => {
  const statements = topLevelStatements(readFileSync(APP_CSS, 'utf8'))

  it('is a single @layer reset block', () => {
    expect(statements).toHaveLength(1)
    expect(statements[0]).toMatch(/^@layer reset\s*\{/)
  })

  it('has no rules outside a layer', () => {
    expect(unlayeredStatements(statements)).toEqual([])
  })
})

describe('built stylesheet', () => {
  let dir: string
  let css: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'layer-order-'))
    const entry = join(dir, 'index.ts')
    writeFileSync(
      entry,
      `import ${JSON.stringify(APP_CSS)}\nexport * from ${JSON.stringify(join(SRC, 'components/ui'))}\n`,
    )
    const result = await build({
      configFile: false,
      root: dir,
      logLevel: 'silent',
      plugins: [stylex.vite(stylexBuildOptions), viteReact()],
      resolve: { alias: { '@': SRC.replace(/\/$/, '') } },
      build: {
        write: false,
        rollupOptions: {
          input: entry,
          // Only our own modules matter; keep packages out of the bundle.
          external: (id) => /^[\w@][^:]/.test(id) && !id.startsWith('@/'),
        },
      },
    })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap(
      (r) => (r as Rollup.RollupOutput).output,
    )
    const assets = outputs.filter(
      (o): o is Rollup.OutputAsset =>
        o.type === 'asset' && o.fileName.endsWith('.css'),
    )
    expect(assets).toHaveLength(1)
    css = String(assets[0]?.source)
  }, 60_000)

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('contains both the reset and StyleX rules', () => {
    expect(css).toContain('box-sizing:inherit')
    expect(css).toMatch(/@layer priority\d/)
  })

  it('declares the reset layer before every StyleX layer', () => {
    const order = layerOrder(topLevelStatements(css))
    expect(order[0]).toBe('reset')
    expect(order.length).toBeGreaterThan(1)
    for (const name of order.slice(1)) expect(name).toMatch(/^priority\d+$/)
  })

  it('sets only custom properties outside a layer', () => {
    const unlayered = unlayeredStatements(topLevelStatements(css))
    // StyleX's priority-0 output (see above) is present, so this is not
    // passing vacuously.
    expect(unlayered.some((s) => s.startsWith(':root'))).toBe(true)
    expect(unlayered.flatMap(nonCustomProperties)).toEqual([])
  })

  it('keeps reset first when the StyleX CSS loads on its own', () => {
    // In dev, /virtual:stylex.css is a separate stylesheet that may load
    // before app.css, so StyleX's own first statement must declare `reset`.
    const [appCss, ...stylexPart] = topLevelStatements(css)
    expect(appCss).toMatch(/^@layer reset\{html\{/)
    expect(stylexPart[0]).toMatch(/^@layer reset, priority\d+/)
    expect(layerOrder(stylexPart)[0]).toBe('reset')
  })
})
