import * as stylex from '@stylexjs/stylex'

/**
 * MUI default breakpoints (xs 0, sm 600, md 900, lg 1200, xl 1536) as media
 * queries, for use as conditional keys:
 *
 *   padding: { default: space.s2, [breakpoints.smUp]: space.s3 }
 *
 * `*Up` matches `theme.breakpoints.up(key)`; `*Down` matches
 * `theme.breakpoints.down(key)` (MUI subtracts 0.05px from the next width).
 * Media queries cannot use CSS variables, hence `defineConsts`.
 */
export const breakpoints = stylex.defineConsts({
  smUp: '@media (min-width: 600px)',
  mdUp: '@media (min-width: 900px)',
  lgUp: '@media (min-width: 1200px)',
  xlUp: '@media (min-width: 1536px)',
  smDown: '@media (max-width: 599.95px)',
  mdDown: '@media (max-width: 899.95px)',
  lgDown: '@media (max-width: 1199.95px)',
  xlDown: '@media (max-width: 1535.95px)',
})

/** Breakpoint widths, e.g. for MUI Container `maxWidth` equivalents. */
export const breakpointWidths = stylex.defineConsts({
  sm: '600px',
  md: '900px',
  lg: '1200px',
  xl: '1536px',
})
