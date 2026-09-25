import * as stylex from '@stylexjs/stylex'

/**
 * Design tokens mirroring the MUI v7 default theme, so StyleX components look
 * the same as the MUI ones they replace. Values come from `createTheme()`.
 *
 * `.stylex.ts` files may only export `defineVars` / `defineConsts` results.
 */

/** MUI default palette (light mode). */
export const colors = stylex.defineVars({
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  onPrimary: '#fff',

  secondary: '#9c27b0',
  secondaryLight: '#ba68c8',
  secondaryDark: '#7b1fa2',
  onSecondary: '#fff',

  error: '#d32f2f',
  errorLight: '#ef5350',
  errorDark: '#c62828',
  onError: '#fff',

  warning: '#ed6c02',
  warningLight: '#ff9800',
  warningDark: '#e65100',
  onWarning: '#fff',

  info: '#0288d1',
  infoLight: '#03a9f4',
  infoDark: '#01579b',
  onInfo: '#fff',

  success: '#2e7d32',
  successLight: '#4caf50',
  successDark: '#1b5e20',
  onSuccess: '#fff',

  grey50: '#fafafa',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  textPrimary: 'rgba(0, 0, 0, 0.87)',
  textSecondary: 'rgba(0, 0, 0, 0.6)',
  textDisabled: 'rgba(0, 0, 0, 0.38)',

  divider: 'rgba(0, 0, 0, 0.12)',

  backgroundDefault: '#fff',
  backgroundPaper: '#fff',

  actionActive: 'rgba(0, 0, 0, 0.54)',
  actionHover: 'rgba(0, 0, 0, 0.04)',
  actionSelected: 'rgba(0, 0, 0, 0.08)',
  actionFocus: 'rgba(0, 0, 0, 0.12)',
  actionDisabled: 'rgba(0, 0, 0, 0.26)',
  actionDisabledBackground: 'rgba(0, 0, 0, 0.12)',

  black: '#000',
  white: '#fff',
})

/** MUI `theme.spacing(n)`: an 8px grid. `s1_5` is spacing(1.5). */
export const space = stylex.defineVars({
  s0: '0px',
  s0_5: '4px',
  s1: '8px',
  s1_5: '12px',
  s2: '16px',
  s3: '24px',
  s4: '32px',
  s5: '40px',
  s6: '48px',
  s8: '64px',
})

/** Corner radii. `sm` is MUI's `shape.borderRadius`. */
export const radii = stylex.defineVars({
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
  circle: '50%',
})

/** MUI `theme.shadows[n]` elevations used by Paper, Card, AppBar, Menu, ... */
export const elevation = stylex.defineVars({
  e0: 'none',
  e1: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
  e2: '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
  e3: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
  e4: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
  e5: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
  e6: '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
  e7: '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
  e8: '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
  e9: '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
  e10: '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
  e11: '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
  e12: '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
  e13: '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
  e14: '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
  e15: '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
  e16: '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
  e17: '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
  e18: '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  e19: '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
  e20: '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
  e21: '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  e22: '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
  e23: '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
  e24: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
})

/** Font family and weights (MUI `typography.fontWeight*`). */
export const font = stylex.defineVars({
  family: '"Roboto", "Helvetica", "Arial", sans-serif',
  weightLight: '300',
  weightRegular: '400',
  weightMedium: '500',
  weightBold: '700',
})

/*
 * MUI type scale, one var group per property, keyed by Typography variant:
 * e.g. `fontSize.h4`, `lineHeight.h4`, `letterSpacing.h4`, `fontWeight.h4`.
 * `button` and `overline` are also uppercase (not a token).
 */

export const fontSize = stylex.defineVars({
  h1: '6rem',
  h2: '3.75rem',
  h3: '3rem',
  h4: '2.125rem',
  h5: '1.5rem',
  h6: '1.25rem',
  subtitle1: '1rem',
  subtitle2: '0.875rem',
  body1: '1rem',
  body2: '0.875rem',
  button: '0.875rem',
  caption: '0.75rem',
  overline: '0.75rem',
})

export const lineHeight = stylex.defineVars({
  h1: '1.167',
  h2: '1.2',
  h3: '1.167',
  h4: '1.235',
  h5: '1.334',
  h6: '1.6',
  subtitle1: '1.75',
  subtitle2: '1.57',
  body1: '1.5',
  body2: '1.43',
  button: '1.75',
  caption: '1.66',
  overline: '2.66',
})

export const letterSpacing = stylex.defineVars({
  h1: '-0.01562em',
  h2: '-0.00833em',
  h3: '0em',
  h4: '0.00735em',
  h5: '0em',
  h6: '0.0075em',
  subtitle1: '0.00938em',
  subtitle2: '0.00714em',
  body1: '0.00938em',
  body2: '0.01071em',
  button: '0.02857em',
  caption: '0.03333em',
  overline: '0.08333em',
})

export const fontWeight = stylex.defineVars({
  h1: '300',
  h2: '300',
  h3: '400',
  h4: '400',
  h5: '400',
  h6: '500',
  subtitle1: '400',
  subtitle2: '500',
  body1: '400',
  body2: '400',
  button: '500',
  caption: '400',
  overline: '400',
})

/** MUI `theme.transitions` durations and easings. */
export const motion = stylex.defineVars({
  durationShortest: '150ms',
  durationShorter: '200ms',
  durationShort: '250ms',
  durationStandard: '300ms',
  durationComplex: '375ms',
  durationEnteringScreen: '225ms',
  durationLeavingScreen: '195ms',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
})

/** MUI `theme.zIndex` stacking order for overlays. */
export const zIndex = stylex.defineVars({
  appBar: '1100',
  drawer: '1200',
  modal: '1300',
  snackbar: '1400',
  tooltip: '1500',
})
