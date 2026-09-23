import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'
import { colors } from '@/styles/tokens.stylex'
import {
  ErrorOutlineIcon,
  InfoOutlinedIcon,
  ReportProblemOutlinedIcon,
  SuccessOutlinedIcon,
} from './Icon'

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error'

/** The icon MUI's Alert shows for each severity. */
export const SEVERITY_ICON: Record<AlertSeverity, ReactNode> = {
  success: <SuccessOutlinedIcon fontSize="inherit" />,
  info: <InfoOutlinedIcon fontSize="inherit" />,
  warning: <ReportProblemOutlinedIcon fontSize="inherit" />,
  error: <ErrorOutlineIcon fontSize="inherit" />,
}

/**
 * MUI "standard" Alert colors, shared by Alert and Toast. MUI derives them
 * from `palette[severity].light`: background `lighten(light, 0.9)` (10% light
 * mixed into white) and text `darken(light, 0.6)` (40% light mixed into
 * black). The icon uses `palette[severity].main`.
 */
export const severityStyles = stylex.create({
  success: {
    backgroundColor: `color-mix(in srgb, ${colors.successLight} 10%, white)`,
    color: `color-mix(in srgb, ${colors.successLight} 40%, black)`,
  },
  info: {
    backgroundColor: `color-mix(in srgb, ${colors.infoLight} 10%, white)`,
    color: `color-mix(in srgb, ${colors.infoLight} 40%, black)`,
  },
  warning: {
    backgroundColor: `color-mix(in srgb, ${colors.warningLight} 10%, white)`,
    color: `color-mix(in srgb, ${colors.warningLight} 40%, black)`,
  },
  error: {
    backgroundColor: `color-mix(in srgb, ${colors.errorLight} 10%, white)`,
    color: `color-mix(in srgb, ${colors.errorLight} 40%, black)`,
  },
})

/** Icon, message and action slots of an Alert-looking box. */
export const alertParts = stylex.create({
  icon: {
    marginRight: '12px',
    padding: '7px 0',
    display: 'flex',
    fontSize: '22px',
    opacity: 0.9,
  },
  iconSuccess: { color: colors.success },
  iconInfo: { color: colors.info },
  iconWarning: { color: colors.warning },
  iconError: { color: colors.error },
  message: { padding: '8px 0', minWidth: 0, overflow: 'auto' },
  action: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '4px 0 0 16px',
    marginLeft: 'auto',
    marginRight: '-8px',
  },
})

export const SEVERITY_ICON_COLOR = {
  success: alertParts.iconSuccess,
  info: alertParts.iconInfo,
  warning: alertParts.iconWarning,
  error: alertParts.iconError,
} as const
