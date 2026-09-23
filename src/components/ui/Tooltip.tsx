import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import * as stylex from '@stylexjs/stylex'
import type { ReactElement, ReactNode } from 'react'
import { colors, font, radii, zIndex } from '@/styles/tokens.stylex'

export interface TooltipProps {
  /** Tooltip text. Keep it supplementary: touch users never see it. */
  title: ReactNode
  /**
   * The trigger. It must accept a ref and spread props onto its DOM
   * element (all ui primitives do). Icon-only triggers still need their own
   * `aria-label`.
   */
  children: ReactElement
  /** Default `bottom`, as in MUI. */
  placement?: 'top' | 'bottom' | 'left' | 'right' | undefined
  /** Hover delay before opening, in ms. Default 100 (MUI `enterDelay`). */
  delay?: number | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  positioner: { zIndex: zIndex.tooltip },
  popup: {
    // MUI: alpha(grey[700], 0.92)
    backgroundColor: `color-mix(in srgb, ${colors.grey700} 92%, transparent)`,
    borderRadius: radii.sm,
    color: colors.white,
    fontFamily: font.family,
    padding: '4px 8px',
    fontSize: '0.6875rem',
    lineHeight: '1.4em',
    maxWidth: '300px',
    margin: '2px',
    overflowWrap: 'break-word',
    fontWeight: font.weightMedium,
    transformOrigin: 'var(--transform-origin)',
    opacity: {
      default: 1,
      '[data-starting-style]': 0,
      '[data-ending-style]': 0,
    },
    transform: {
      default: 'none',
      '[data-starting-style]': 'scale(0.75)',
      '[data-ending-style]': 'scale(0.75)',
    },
    transitionProperty: 'opacity, transform',
    transitionDuration: {
      default: '200ms',
      '[data-instant]': '0s',
    },
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
})

/** Hover / focus hint for its child (MUI `Tooltip`) on Base UI Tooltip. */
export function Tooltip({
  title,
  children,
  placement = 'bottom',
  delay = 100,
  xstyle,
}: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} delay={delay} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          side={placement}
          sideOffset={12}
          {...stylex.props(styles.positioner)}
        >
          <BaseTooltip.Popup {...stylex.props(styles.popup, xstyle)}>
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
