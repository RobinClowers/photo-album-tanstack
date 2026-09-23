import * as stylex from '@stylexjs/stylex'

/**
 * Target row height of the photo grid, read by each `PhotoGridItem` to size
 * its tile: 200px on phones (MUI `down('sm')`), 320px from sm up. Keep the
 * values in sync with the `ROW_HEIGHT*` srcset hints in PhotoGridItem.
 *
 * The breakpoint lives here rather than in a `stylex.create` override such
 * as `[photoGrid.rowHeight]: { default: '200px', '@media ...': '320px' }`:
 * with CSS layers on, StyleX emits the default var override unlayered and
 * the @media one inside a layer, so the default always wins in builds.
 */
export const photoGrid = stylex.defineVars({
  rowHeight: {
    default: '320px',
    '@media (max-width: 599.95px)': '200px',
  },
})
