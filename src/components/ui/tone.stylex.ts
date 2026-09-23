import * as stylex from '@stylexjs/stylex'

/**
 * The palette color a primitive is painted with, set per element by
 * `toneStyles` (see tone.ts) and read by variant styles. Mirrors MUI's
 * `palette[color]` lookups (`main`, `dark`, `contrastText`) plus the derived
 * translucent shades MUI computes with `alpha()` / `lighten()` / `darken()`.
 * Defaults are MUI primary.
 */
export const tone = stylex.defineVars({
  /** `palette[color].main`. */
  main: '#1976d2',
  /** `palette[color].dark`, the contained hover background. */
  dark: '#1565c0',
  /** `palette[color].contrastText`. */
  contrast: '#fff',
  /** Text / outlined hover background (`alpha(main, 0.04)`). */
  hover: 'rgba(25, 118, 210, 0.04)',
  /** Outlined button border (`alpha(main, 0.5)`). */
  border: 'rgba(25, 118, 210, 0.5)',
})
