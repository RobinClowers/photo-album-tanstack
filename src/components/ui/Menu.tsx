import { Menu as BaseMenu } from '@base-ui/react/menu'
import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { breakpoints } from '@/styles/breakpoints.stylex'
import {
  colors,
  elevation,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  radii,
  zIndex,
} from '@/styles/tokens.stylex'

export interface MenuProps {
  /** The element that opens the menu, e.g. `<Button>Actions</Button>`. */
  trigger: ReactElement
  children: ReactNode
  /** Controlled open state (optional). */
  open?: boolean | undefined
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Popup placement relative to the trigger. Default `bottom` / `start`. */
  side?: 'top' | 'bottom' | 'left' | 'right' | undefined
  align?: 'start' | 'center' | 'end' | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  positioner: { zIndex: zIndex.modal, outlineStyle: 'none' },
  popup: {
    boxSizing: 'border-box',
    minWidth: '16px',
    maxHeight: 'calc(var(--available-height) - 16px)',
    overflowY: 'auto',
    padding: '8px 0',
    outlineStyle: 'none',
    backgroundColor: colors.backgroundPaper,
    color: colors.textPrimary,
    borderRadius: radii.sm,
    boxShadow: elevation.e8,
    transformOrigin: 'var(--transform-origin)',
    opacity: {
      default: 1,
      '[data-starting-style]': 0,
      '[data-ending-style]': 0,
    },
    transform: {
      default: 'none',
      '[data-starting-style]': 'scale(0.75, 0.5625)',
      '[data-ending-style]': 'scale(0.75, 0.5625)',
    },
    transitionProperty: 'opacity, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  item: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    textDecoration: 'none',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    outlineStyle: 'none',
    minHeight: { default: '48px', [breakpoints.smUp]: 'auto' },
    padding: '6px 16px',
    fontFamily: font.family,
    fontSize: fontSize.body1,
    lineHeight: lineHeight.body1,
    letterSpacing: letterSpacing.body1,
    fontWeight: fontWeight.body1,
    backgroundColor: {
      default: 'transparent',
      '[data-highlighted]': colors.actionHover,
    },
    opacity: { default: 1, '[data-disabled]': 0.38 },
    pointerEvents: { default: 'auto', '[data-disabled]': 'none' },
  },
})

/** Dropdown menu (MUI `Menu`) on Base UI Menu: arrow-key navigation, typeahead, Escape. */
export function Menu({
  trigger,
  children,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  xstyle,
}: MenuProps) {
  return (
    <BaseMenu.Root
      open={open}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          side={side}
          align={align}
          sideOffset={4}
          {...stylex.props(styles.positioner)}
        >
          <BaseMenu.Popup {...stylex.props(styles.popup, xstyle)}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  )
}

export interface MenuItemProps
  extends Omit<ComponentProps<'div'>, 'className' | 'style'> {
  disabled?: boolean | undefined
  /** Keep the menu open after this item is chosen. */
  closeOnClick?: boolean | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

/** A menu entry; `onClick` fires on click, Enter or Space. */
export function MenuItem({
  xstyle,
  disabled,
  closeOnClick,
  ...props
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      disabled={disabled}
      closeOnClick={closeOnClick}
      {...props}
      {...stylex.props(styles.item, xstyle)}
    />
  )
}
