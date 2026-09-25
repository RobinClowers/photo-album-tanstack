import * as stylex from '@stylexjs/stylex'
import { colors } from '@/styles/tokens.stylex'
import { tone } from './tone.stylex'

/** MUI palette colors a primitive can be painted with. */
export type PaletteColor =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'

/** Palette colors plus MUI's `inherit` (use the surrounding text color). */
export type ToneColor = PaletteColor | 'inherit'

/**
 * Sets the `tone` vars for a palette color. Apply one of these to an element
 * before the variant styles that read `tone.*`.
 */
export const toneStyles = stylex.create({
  primary: {
    [tone.main]: colors.primary,
    [tone.dark]: colors.primaryDark,
    [tone.contrast]: colors.onPrimary,
    [tone.hover]: `color-mix(in srgb, ${colors.primary} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.primary} 50%, transparent)`,
  },
  secondary: {
    [tone.main]: colors.secondary,
    [tone.dark]: colors.secondaryDark,
    [tone.contrast]: colors.onSecondary,
    [tone.hover]: `color-mix(in srgb, ${colors.secondary} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.secondary} 50%, transparent)`,
  },
  error: {
    [tone.main]: colors.error,
    [tone.dark]: colors.errorDark,
    [tone.contrast]: colors.onError,
    [tone.hover]: `color-mix(in srgb, ${colors.error} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.error} 50%, transparent)`,
  },
  warning: {
    [tone.main]: colors.warning,
    [tone.dark]: colors.warningDark,
    [tone.contrast]: colors.onWarning,
    [tone.hover]: `color-mix(in srgb, ${colors.warning} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.warning} 50%, transparent)`,
  },
  info: {
    [tone.main]: colors.info,
    [tone.dark]: colors.infoDark,
    [tone.contrast]: colors.onInfo,
    [tone.hover]: `color-mix(in srgb, ${colors.info} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.info} 50%, transparent)`,
  },
  success: {
    [tone.main]: colors.success,
    [tone.dark]: colors.successDark,
    [tone.contrast]: colors.onSuccess,
    [tone.hover]: `color-mix(in srgb, ${colors.success} 4%, transparent)`,
    [tone.border]: `color-mix(in srgb, ${colors.success} 50%, transparent)`,
  },
  inherit: {
    [tone.main]: 'currentColor',
    [tone.dark]: 'currentColor',
    [tone.contrast]: 'currentColor',
    [tone.hover]: colors.actionHover,
    [tone.border]: 'currentColor',
  },
})
