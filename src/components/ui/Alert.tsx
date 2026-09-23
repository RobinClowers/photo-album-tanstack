import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactNode } from 'react'
import {
  colors,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radii,
} from '@/styles/tokens.stylex'
import {
  CloseIcon,
  ErrorOutlineIcon,
  InfoOutlinedIcon,
  ReportProblemOutlinedIcon,
  SuccessOutlinedIcon,
} from './Icon'
import { IconButton } from './IconButton'

export type AlertSeverity = 'success' | 'info' | 'warning' | 'error'

export interface AlertProps
  extends Omit<ComponentProps<'div'>, 'className' | 'style'> {
  /** Default `success`, as in MUI. */
  severity?: AlertSeverity | undefined
  /** Replace the severity icon, or `false` for none. */
  icon?: ReactNode | false | undefined
  /** Content on the right, e.g. a Button. Replaces the close button. */
  action?: ReactNode | undefined
  /** Shows a close button that calls this. */
  onClose?: (() => void) | undefined
  /** Accessible name of the close button. Default `Close`. */
  closeLabel?: string | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const SEVERITY_ICON: Record<AlertSeverity, ReactNode> = {
  success: <SuccessOutlinedIcon fontSize="inherit" />,
  info: <InfoOutlinedIcon fontSize="inherit" />,
  warning: <ReportProblemOutlinedIcon fontSize="inherit" />,
  error: <ErrorOutlineIcon fontSize="inherit" />,
}

// MUI "standard" alerts: background lighten(main, 0.9), text darken(main, 0.6).
const styles = stylex.create({
  root: {
    display: 'flex',
    padding: '6px 16px',
    borderRadius: radii.sm,
    boxSizing: 'border-box',
    fontFamily: font.family,
    fontSize: fontSize.body2,
    lineHeight: lineHeight.body2,
    letterSpacing: letterSpacing.body2,
    fontWeight: fontWeight.body2,
  },
  success: {
    backgroundColor: `color-mix(in srgb, ${colors.success} 10%, white)`,
    color: `color-mix(in srgb, ${colors.success} 40%, black)`,
  },
  info: {
    backgroundColor: `color-mix(in srgb, ${colors.info} 10%, white)`,
    color: `color-mix(in srgb, ${colors.info} 40%, black)`,
  },
  warning: {
    backgroundColor: `color-mix(in srgb, ${colors.warning} 10%, white)`,
    color: `color-mix(in srgb, ${colors.warning} 40%, black)`,
  },
  error: {
    backgroundColor: `color-mix(in srgb, ${colors.error} 10%, white)`,
    color: `color-mix(in srgb, ${colors.error} 40%, black)`,
  },
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

const ICON_COLOR = {
  success: styles.iconSuccess,
  info: styles.iconInfo,
  warning: styles.iconWarning,
  error: styles.iconError,
} as const

/** Inline status message (MUI `Alert`, standard variant). */
export function Alert({
  severity = 'success',
  icon,
  action,
  onClose,
  closeLabel = 'Close',
  role = 'alert',
  xstyle,
  children,
  ...props
}: AlertProps) {
  const iconNode = icon === undefined ? SEVERITY_ICON[severity] : icon
  const actionNode =
    action ??
    (onClose ? (
      <IconButton
        size="small"
        color="inherit"
        aria-label={closeLabel}
        title={closeLabel}
        onClick={onClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    ) : null)
  return (
    <div
      role={role}
      {...props}
      {...stylex.props(styles.root, styles[severity], xstyle)}
    >
      {iconNode !== false && iconNode !== null ? (
        <div {...stylex.props(styles.icon, ICON_COLOR[severity])}>
          {iconNode}
        </div>
      ) : null}
      <div {...stylex.props(styles.message)}>{children}</div>
      {actionNode ? (
        <div {...stylex.props(styles.action)}>{actionNode}</div>
      ) : null}
    </div>
  )
}
