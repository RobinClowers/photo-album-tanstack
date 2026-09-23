import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactNode } from 'react'
import {
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radii,
} from '@/styles/tokens.stylex'
import { CloseIcon } from './Icon'
import { IconButton } from './IconButton'
import {
  type AlertSeverity,
  alertParts,
  SEVERITY_ICON,
  SEVERITY_ICON_COLOR,
  severityStyles,
} from './severity'

export type { AlertSeverity }

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
})

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
      {...stylex.props(styles.root, severityStyles[severity], xstyle)}
    >
      {iconNode !== false && iconNode !== null ? (
        <div {...stylex.props(alertParts.icon, SEVERITY_ICON_COLOR[severity])}>
          {iconNode}
        </div>
      ) : null}
      <div {...stylex.props(alertParts.message)}>{children}</div>
      {actionNode ? (
        <div {...stylex.props(alertParts.action)}>{actionNode}</div>
      ) : null}
    </div>
  )
}
