import { Button as BaseButton } from '@base-ui/react/button'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ReactElement, ReactNode } from 'react'
import {
  colors,
  elevation,
  font,
  fontSize,
  letterSpacing,
  lineHeight,
  motion,
  radii,
} from '@/styles/tokens.stylex'
import { iconSize } from './icon.stylex'
import { type ToneColor, toneStyles } from './tone'
import { tone } from './tone.stylex'

export type ButtonVariant = 'text' | 'outlined' | 'contained'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps
  extends Omit<
    useRender.ComponentProps<'button'>,
    'className' | 'style' | 'color'
  > {
  /** MUI Button variants. Default `text`. */
  variant?: ButtonVariant | undefined
  /** Default `medium`. */
  size?: ButtonSize | undefined
  /** Palette color, or `inherit` for the surrounding text color. Default `primary`. */
  color?: ToneColor | undefined
  fullWidth?: boolean | undefined
  startIcon?: ReactNode | undefined
  endIcon?: ReactNode | undefined
  /** Render an `<a href>` styled as a button (MUI `<Button href>`). */
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  /**
   * Render as another element, keeping its own semantics, e.g. a router link
   * `render={<Link to="/admin" />}` or `render={<a href="..." />}`. Without
   * it the button is a native `<button type="button">`.
   */
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const transition = {
  transitionProperty: 'background-color, box-shadow, border-color, color',
  transitionDuration: motion.durationShort,
  transitionTimingFunction: motion.easeInOut,
} as const

const styles = stylex.create({
  base: {
    ...transition,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '2px',
    outlineColor: tone.main,
    outlineOffset: '2px',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    margin: 0,
    borderRadius: radii.sm,
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    textDecoration: 'none',
    fontFamily: font.family,
    fontWeight: font.weightMedium,
    fontSize: fontSize.button,
    lineHeight: lineHeight.button,
    letterSpacing: letterSpacing.button,
    textTransform: 'uppercase',
    minWidth: '64px',
  },
  text: {
    color: tone.main,
    padding: '6px 8px',
    backgroundColor: { default: 'transparent', ':hover': tone.hover },
  },
  outlined: {
    color: tone.main,
    padding: '5px 15px',
    borderWidth: '1px',
    borderColor: { default: tone.border, ':hover': tone.main },
    backgroundColor: { default: 'transparent', ':hover': tone.hover },
  },
  contained: {
    color: tone.contrast,
    padding: '6px 16px',
    backgroundColor: { default: tone.main, ':hover': tone.dark },
    boxShadow: {
      default: elevation.e2,
      ':hover': elevation.e4,
      ':active': elevation.e8,
    },
  },
  // MUI paints `color="inherit" variant="contained"` grey.
  containedInherit: {
    color: colors.textPrimary,
    backgroundColor: { default: colors.grey300, ':hover': colors.grey100 },
  },
  textSmall: { padding: '4px 5px', fontSize: '0.8125rem' },
  textLarge: { padding: '8px 11px', fontSize: '0.9375rem' },
  outlinedSmall: { padding: '3px 9px', fontSize: '0.8125rem' },
  outlinedLarge: { padding: '7px 21px', fontSize: '0.9375rem' },
  containedSmall: { padding: '4px 10px', fontSize: '0.8125rem' },
  containedLarge: { padding: '8px 22px', fontSize: '0.9375rem' },
  fullWidth: { width: '100%' },
  disabled: {
    cursor: 'default',
    pointerEvents: 'none',
    color: colors.actionDisabled,
  },
  disabledOutlined: { borderColor: colors.actionDisabledBackground },
  disabledContained: {
    backgroundColor: colors.actionDisabledBackground,
    boxShadow: 'none',
  },
  icon: {
    display: 'inherit',
    [iconSize.small]: '20px',
    [iconSize.medium]: '20px',
    [iconSize.large]: '20px',
  },
  iconSmall: {
    [iconSize.small]: '18px',
    [iconSize.medium]: '18px',
    [iconSize.large]: '18px',
  },
  iconLarge: {
    [iconSize.small]: '22px',
    [iconSize.medium]: '22px',
    [iconSize.large]: '22px',
  },
  startIcon: { marginRight: '8px', marginLeft: '-4px' },
  startIconSmall: { marginLeft: '-2px' },
  endIcon: { marginLeft: '8px', marginRight: '-4px' },
  endIconSmall: { marginRight: '-2px' },
})

const sizeStyles = {
  text: { small: styles.textSmall, medium: null, large: styles.textLarge },
  outlined: {
    small: styles.outlinedSmall,
    medium: null,
    large: styles.outlinedLarge,
  },
  contained: {
    small: styles.containedSmall,
    medium: null,
    large: styles.containedLarge,
  },
} as const

/** MUI-style Button on Base UI Button. */
export function Button({
  variant = 'text',
  size = 'medium',
  color = 'primary',
  fullWidth = false,
  startIcon,
  endIcon,
  disabled = false,
  href,
  target,
  rel,
  render,
  xstyle,
  children,
  ...props
}: ButtonProps) {
  const element =
    render ??
    (href !== undefined ? (
      // biome-ignore lint/a11y/useAnchorContent: useRender supplies the children
      <a href={href} target={target} rel={rel} />
    ) : undefined)
  const iconSizeStyle =
    size === 'small'
      ? styles.iconSmall
      : size === 'large'
        ? styles.iconLarge
        : null
  const content = (
    <>
      {startIcon ? (
        <span
          {...stylex.props(
            styles.icon,
            iconSizeStyle,
            styles.startIcon,
            size === 'small' && styles.startIconSmall,
          )}
        >
          {startIcon}
        </span>
      ) : null}
      {children}
      {endIcon ? (
        <span
          {...stylex.props(
            styles.icon,
            iconSizeStyle,
            styles.endIcon,
            size === 'small' && styles.endIconSmall,
          )}
        >
          {endIcon}
        </span>
      ) : null}
    </>
  )

  const styleProps = stylex.props(
    toneStyles[color],
    styles.base,
    styles[variant],
    sizeStyles[variant][size],
    variant === 'contained' && color === 'inherit' && styles.containedInherit,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    disabled && variant === 'outlined' && styles.disabledOutlined,
    disabled && variant === 'contained' && styles.disabledContained,
    xstyle,
  )

  // A native <button> gets Base UI's button behaviour; anything else (links)
  // keeps its own semantics and is only styled like a button.
  const stateProps = element
    ? disabled
      ? { 'aria-disabled': true, 'data-disabled': '', tabIndex: -1 }
      : {}
    : { disabled }

  return useRender({
    render: element ?? <BaseButton />,
    props: mergeProps<'button'>(styleProps, stateProps, props, {
      children: content,
    }),
  })
}
