import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactNode } from 'react'
import { breakpointWidths } from '@/styles/breakpoints.stylex'
import {
  colors,
  elevation,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  motion,
  radii,
  zIndex,
} from '@/styles/tokens.stylex'

export interface DialogProps {
  open: boolean
  /** Called on Escape, a backdrop click, or other dismissal requests. */
  onClose: () => void
  /** MUI max widths: xs 444px, sm 600 (default), md 900, lg 1200, xl 1536. */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false | undefined
  /** Stretch to the max width. */
  fullWidth?: boolean | undefined
  children: ReactNode
  xstyle?: stylex.StyleXStyles | undefined
}

const fade = {
  opacity: {
    default: 1,
    '[data-starting-style]': 0,
    '[data-ending-style]': 0,
  },
  transitionProperty: 'opacity',
  transitionDuration: {
    default: motion.durationEnteringScreen,
    '[data-ending-style]': motion.durationLeavingScreen,
  },
  transitionTimingFunction: motion.easeInOut,
} as const

const styles = stylex.create({
  backdrop: {
    ...fade,
    position: 'fixed',
    inset: 0,
    zIndex: zIndex.modal,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    WebkitTapHighlightColor: 'transparent',
  },
  viewport: {
    position: 'fixed',
    inset: 0,
    zIndex: zIndex.modal,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    ...fade,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    margin: '32px',
    maxHeight: 'calc(100% - 64px)',
    overflowY: 'auto',
    outlineStyle: 'none',
    backgroundColor: colors.backgroundPaper,
    color: colors.textPrimary,
    borderRadius: radii.sm,
    boxShadow: elevation.e24,
  },
  xs: { maxWidth: '444px' },
  sm: { maxWidth: breakpointWidths.sm },
  md: { maxWidth: breakpointWidths.md },
  lg: { maxWidth: breakpointWidths.lg },
  xl: { maxWidth: breakpointWidths.xl },
  fullWidth: { width: 'calc(100% - 64px)' },
  title: {
    margin: 0,
    padding: '16px 24px',
    flex: '0 0 auto',
    fontFamily: font.family,
    fontSize: fontSize.h6,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.h6,
    fontWeight: fontWeight.h6,
  },
  content: {
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '20px 24px',
    // MUI: `.MuiDialogTitle-root + .MuiDialogContent-root { padding-top: 0 }`
    paddingTop: {
      default: '20px',
      [stylex.when.siblingBefore('[data-dialog-title]')]: 0,
    },
  },
  contentText: {
    margin: 0,
    fontFamily: font.family,
    fontSize: fontSize.body1,
    lineHeight: lineHeight.body1,
    letterSpacing: letterSpacing.body1,
    fontWeight: fontWeight.body1,
    color: colors.textSecondary,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: '0 0 auto',
    gap: '8px',
    padding: '8px',
  },
})

/** Modal dialog (MUI `Dialog`) on Base UI Dialog: focus trap, Escape, backdrop. */
export function Dialog({
  open,
  onClose,
  maxWidth = 'sm',
  fullWidth = false,
  children,
  xstyle,
}: DialogProps) {
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop {...stylex.props(styles.backdrop)} />
        <BaseDialog.Viewport {...stylex.props(styles.viewport)}>
          <BaseDialog.Popup
            {...stylex.props(
              styles.popup,
              maxWidth && styles[maxWidth],
              fullWidth && styles.fullWidth,
              xstyle,
            )}
          >
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}

type Props<Tag extends keyof React.JSX.IntrinsicElements> = Omit<
  ComponentProps<Tag>,
  'className' | 'style'
> & { xstyle?: stylex.StyleXStyles }

/** The dialog's accessible name (`<h2>`). */
export function DialogTitle({ xstyle, ...props }: Props<'h2'>) {
  return (
    <BaseDialog.Title
      data-dialog-title=""
      {...props}
      {...stylex.props(stylex.defaultMarker(), styles.title, xstyle)}
    />
  )
}

export function DialogContent({ xstyle, ...props }: Props<'div'>) {
  return <div {...props} {...stylex.props(styles.content, xstyle)} />
}

/** Secondary body text; describes the dialog for assistive tech. */
export function DialogContentText({ xstyle, ...props }: Props<'p'>) {
  return (
    <BaseDialog.Description
      {...props}
      {...stylex.props(styles.contentText, xstyle)}
    />
  )
}

/** Right-aligned button row. */
export function DialogActions({ xstyle, ...props }: Props<'div'>) {
  return <div {...props} {...stylex.props(styles.actions, xstyle)} />
}
