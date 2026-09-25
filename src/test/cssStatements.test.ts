import { describe, expect, it } from 'vitest'
import {
  layerOrder,
  nonCustomProperties,
  topLevelStatements,
  unlayeredStatements,
} from './cssStatements'

describe('topLevelStatements', () => {
  it('splits rules, blocks and statements, dropping comments', () => {
    const css = `/* header { } */
@layer a, b;
@layer a { html { color: red } @media print { body { margin: 0 } } }
body { content: "}" ; }
@charset "utf-8";`
    expect(topLevelStatements(css)).toEqual([
      '@layer a, b;',
      '@layer a { html { color: red } @media print { body { margin: 0 } } }',
      'body { content: "}" ; }',
      '@charset "utf-8";',
    ])
  })

  it('handles minified input', () => {
    expect(
      topLevelStatements('@layer reset{a{b:c}}@layer reset;x{y:z}'),
    ).toEqual(['@layer reset{a{b:c}}', '@layer reset;', 'x{y:z}'])
  })
})

describe('layerOrder', () => {
  it('lists layers by first declaration', () => {
    expect(
      layerOrder(['@layer b{x{}}', '@layer a, b;', '@layer c {y{}}', 'z{}']),
    ).toEqual(['b', 'a', 'c'])
  })
})

describe('unlayeredStatements', () => {
  it('returns rules and at-rules outside any layer', () => {
    expect(
      unlayeredStatements([
        '@layer a;',
        '@layer a{x{}}',
        '@charset "utf-8";',
        'body{margin:0}',
        '@media print{body{margin:0}}',
        '@import "x.css";',
        '@keyframes spin{to{rotate:1turn}}',
      ]),
    ).toEqual([
      'body{margin:0}',
      '@media print{body{margin:0}}',
      '@import "x.css";',
      '@keyframes spin{to{rotate:1turn}}',
    ])
  })
})

describe('nonCustomProperties', () => {
  it('lists regular properties, including nested ones', () => {
    expect(
      nonCustomProperties(':root, .x1{--a:1px;color:red;--b: 2px; margin : 0}'),
    ).toEqual(['color', 'margin'])
    expect(
      nonCustomProperties('@media (min-width:600px){.x{display:flex}}'),
    ).toEqual(['display'])
  })

  it('treats custom-property-only rules and registrations as empty', () => {
    expect(nonCustomProperties(':root, .x1{--a:1px;--b:var(--c)}')).toEqual([])
    expect(
      nonCustomProperties('@property --x{syntax:"*";inherits:false}'),
    ).toEqual([])
    expect(
      nonCustomProperties('@keyframes spin{from{rotate:0}to{rotate:1turn}}'),
    ).toEqual([])
  })
})
