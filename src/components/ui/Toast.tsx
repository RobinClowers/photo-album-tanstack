import { Toast as BaseToast } from '@base-ui/react/toast'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useRef } from 'react'
import { breakpoints } from '@/styles/breakpoints.stylex'
import {
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  motion,
  radii,
  zIndex,
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

const SEVERITIES: AlertSeverity[] = ['success', 'info', 'warning', 'error']

const severityOf = (type: string | undefined): AlertSeverity =>
  SEVERITIES.includes(type as AlertSeverity) ? (type as AlertSeverity) : 'info'

/**
 * Errors and warnings are announced assertively (Base UI renders them as
 * `alertdialog` plus a `role="alert"` mirror), like the MUI `Alert` inside a
 * Snackbar they replace; other toasts are announced politely.
 */
const priorityOf = (severity: AlertSeverity): 'high' | 'low' =>
  severity === 'error' || severity === 'warning' ? 'high' : 'low'

// Placement of MUI's default Snackbar (bottom left), and a toast that looks
// like the standard Alert the app shows inside it.
const styles = stylex.create({
  viewport: {
    position: 'fixed',
    zIndex: zIndex.snackbar,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '8px',
    left: { default: '8px', [breakpoints.smUp]: '24px' },
    right: { default: '8px', [breakpoints.smUp]: 'auto' },
    bottom: { default: '8px', [breakpoints.smUp]: '24px' },
    outlineStyle: 'none',
  },
  toast: {
    display: 'flex',
    boxSizing: 'border-box',
    padding: '6px 16px',
    borderRadius: radii.sm,
    fontFamily: font.family,
    fontSize: fontSize.body2,
    lineHeight: lineHeight.body2,
    letterSpacing: letterSpacing.body2,
    fontWeight: fontWeight.body2,
    minWidth: { default: null, [breakpoints.smUp]: '288px' },
    opacity: {
      default: 1,
      '[data-starting-style]': 0,
      '[data-ending-style]': 0,
    },
    transform: {
      default: 'none',
      '[data-starting-style]': 'scale(0.8)',
      '[data-ending-style]': 'scale(0.8)',
    },
    transitionProperty: 'opacity, transform',
    transitionDuration: motion.durationEnteringScreen,
    transitionTimingFunction: motion.easeInOut,
  },
  title: { margin: 0, fontWeight: font.weightMedium },
  description: { margin: 0 },
})

function ToastList() {
  const { toasts } = BaseToast.useToastManager()
  return toasts.map((toast) => {
    const severity = severityOf(toast.type)
    return (
      <BaseToast.Root
        key={toast.id}
        toast={toast}
        {...stylex.props(styles.toast, severityStyles[severity])}
      >
        <div {...stylex.props(alertParts.icon, SEVERITY_ICON_COLOR[severity])}>
          {SEVERITY_ICON[severity]}
        </div>
        <div {...stylex.props(alertParts.message)}>
          {toast.title ? (
            <BaseToast.Title {...stylex.props(styles.title)} />
          ) : null}
          <BaseToast.Description {...stylex.props(styles.description)} />
        </div>
        <div {...stylex.props(alertParts.action)}>
          <BaseToast.Close
            aria-label="Close"
            render={
              <IconButton size="small" color="inherit" title="Close">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          />
        </div>
      </BaseToast.Root>
    )
  })
}

/**
 * Renders toasts (MUI `Snackbar` + `Alert` replacement) at the bottom left.
 * Mount once around the pages that show toasts.
 */
export function ToastProvider({
  children,
  limit = 3,
}: {
  children: ReactNode
  limit?: number | undefined
}) {
  return (
    <BaseToast.Provider limit={limit}>
      {children}
      <BaseToast.Portal>
        <BaseToast.Viewport {...stylex.props(styles.viewport)}>
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  )
}

export interface ShowToastOptions {
  message: ReactNode
  title?: ReactNode | undefined
  /** Default `info`. */
  severity?: AlertSeverity | undefined
  /** Auto-dismiss after this many ms; 0 keeps it open. Default 5000. */
  timeout?: number | undefined
  /** Called when the toast closes (timeout, close button, swipe or `close`). */
  onClose?: (() => void) | undefined
}

/** Imperative toasts: `const toast = useToast(); toast.show({ message })`. */
export function useToast() {
  const manager = BaseToast.useToastManager()
  return {
    show: ({
      message,
      title,
      severity = 'info',
      timeout,
      onClose,
    }: ShowToastOptions) =>
      manager.add({
        description: message,
        title,
        type: severity,
        priority: priorityOf(severity),
        timeout,
        onClose,
      }),
    close: (id?: string) => manager.close(id),
  }
}

export interface ToastProps {
  /** Show the toast while true. */
  open: boolean
  /** Called when the user or the timeout dismisses it. */
  onClose?: (() => void) | undefined
  /** Default `info`. */
  severity?: AlertSeverity | undefined
  /** Auto-dismiss after this many ms; 0 (default) keeps it open, like MUI Snackbar. */
  timeout?: number | undefined
  title?: ReactNode | undefined
  children: ReactNode
}

/**
 * Declarative toast for the Snackbar pattern
 * `<Toast open={Boolean(error)} severity="error" onClose={clearError}>{error}</Toast>`.
 * Renders nothing itself; needs a `ToastProvider` above it. Changing
 * `children` (or the other props) while open updates the toast in place and
 * restarts its timeout, so pass a stable message such as a string.
 */
export function Toast({
  open,
  onClose,
  severity = 'info',
  timeout = 0,
  title,
  children,
}: ToastProps) {
  const manager = BaseToast.useToastManager()
  const managerRef = useRef(manager)
  managerRef.current = manager
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    const current = managerRef.current
    if (!open) {
      const id = idRef.current
      idRef.current = null
      if (id) current.close(id)
      return
    }
    const id: string = current.add({
      id: idRef.current ?? undefined,
      description: children,
      title,
      type: severity,
      priority: priorityOf(severity),
      timeout,
      onClose: () => {
        // Closed by the user or the timeout, not by `open` turning false.
        if (idRef.current !== id) return
        idRef.current = null
        onCloseRef.current?.()
      },
    })
    idRef.current = id
  }, [open, children, title, severity, timeout])

  // Take the toast down with the component.
  useEffect(
    () => () => {
      const id = idRef.current
      idRef.current = null
      if (id) managerRef.current.close(id)
    },
    [],
  )

  return null
}
