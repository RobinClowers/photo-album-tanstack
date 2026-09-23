import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BIOME = join(ROOT, 'node_modules', '.bin', 'biome')
const dir = mkdtempSync(join(tmpdir(), 'border-guard-'))

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

interface Diagnostic {
  category: string
  location: { start: { line: number } }
}

/** Lints `source` with the repo's biome.json; returns plugin hits by line. */
function pluginHits(source: string): number[] {
  const file = join(dir, `fixture-${Math.random().toString(36).slice(2)}.tsx`)
  writeFileSync(file, source)
  let out: string
  try {
    out = execFileSync(
      BIOME,
      ['lint', `--config-path=${ROOT}`, '--reporter=json', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    )
  } catch (error) {
    // biome exits non-zero when it reports errors; the JSON is still on stdout.
    out = (error as { stdout: string }).stdout
  }
  const { diagnostics } = JSON.parse(out) as { diagnostics: Diagnostic[] }
  return diagnostics
    .filter((d) => d.category === 'plugin')
    .map((d) => d.location.start.line)
}

describe('no-stylex-border-shorthand Biome plugin', () => {
  it('flags every border shorthand inside stylex.create, at any depth', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex'",
      'export const s = stylex.create({',
      '  a: {',
      "    border: '1px solid red',", // 4
      "    borderTop: 'none',", // 5
      '    borderRight: 0,', // 6
      "    'borderBottom': '1px solid',", // 7
      "    borderLeft: '1px solid',", // 8
      "    borderBlock: '1px solid',", // 9
      "    borderBlockStart: '1px solid',", // 10
      "    borderBlockEnd: '1px solid',", // 11
      "    borderInline: '1px solid',", // 12
      "    borderInlineStart: '1px solid',", // 13
      "    borderInlineEnd: '1px solid',", // 14
      "    ':hover': { border: '2px solid blue' },", // 15
      "    borderTop2: { default: 'x' },", // near miss: not a CSS shorthand
      '  },',
      '})',
    ].join('\n')
    expect(pluginHits(source)).toEqual([
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ])
  })

  it('allows longhands and other multi-value shorthands', () => {
    const source = [
      "import * as stylex from '@stylexjs/stylex'",
      'export const s = stylex.create({',
      '  a: {',
      "    borderWidth: '1px',",
      "    borderStyle: 'solid',",
      "    borderColor: { default: 'red', ':hover': 'blue' },",
      "    borderTopWidth: '1px',",
      "    borderBlockWidth: '1px 2px',",
      "    borderRadius: '4px 8px',",
      "    padding: '4px 8px',",
      "    outline: '1px solid red',",
      '  },',
      '})',
    ].join('\n')
    expect(pluginHits(source)).toEqual([])
  })

  it('ignores border keys outside stylex.create', () => {
    const source = [
      "export const inline = { border: '1px solid red' }",
      "export const sx = { borderTop: '1px solid' }",
    ].join('\n')
    expect(pluginHits(source)).toEqual([])
  })
})
