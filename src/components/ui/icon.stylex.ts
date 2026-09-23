import * as stylex from '@stylexjs/stylex'

/**
 * Icon sizes for `<Icon fontSize>` (MUI SvgIcon: small 20px, medium 24px,
 * large 35px). A container can override them to size the icons inside it,
 * like MUI's Button does for its start/end icons.
 */
export const iconSize = stylex.defineVars({
  small: '1.25rem',
  medium: '1.5rem',
  large: '2.1875rem',
})
