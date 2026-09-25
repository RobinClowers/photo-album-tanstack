import { Button as BaseButton } from '@base-ui/react/button'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import { colors, motion, radii } from '@/styles/tokens.stylex'
import { type ToneColor, toneStyles } from './tone'
import { tone } from './tone.stylex'

export interface IconButtonProps
  extends Omit<
    useRender.ComponentProps<'button'>,
    'className' | 'style' | 'color'
  > {
  /** `default` is MUI's grey action color. Default `default`. */
  color?: ToneColor | 'default' | undefined
  /** small 5px / medium 8px / large 12px padding. Default `medium`. */
  size?: 'small' | 'medium' | 'large' | undefined
  /** Negative margin to align the icon with content edges, as in MUI. */
  edge?: 'start' | 'end' | false | undefined
  /** Render an `<a href>` (MUI `<IconButton href>`). */
  href?: string | undefined
  target?: string | undefined
  rel?: string | undefined
  /** Render as another element (e.g. a router `Link`), keeping its semantics. */
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    WebkitTapHighlightColor: 'transparent',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '2px',
    outlineColor: 'currentColor',
    outlineOffset: '-2px',
    borderWidth: 0,
    margin: 0,
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    textDecoration: 'none',
    textAlign: 'center',
    flex: '0 0 auto',
    fontSize: '1.5rem',
    padding: '8px',
    borderRadius: radii.circle,
    color: tone.main,
    backgroundColor: { default: 'transparent', ':hover': tone.hover },
    transitionProperty: 'background-color',
    transitionDuration: motion.durationShortest,
    transitionTimingFunction: motion.easeInOut,
  },
  default: {
    [tone.main]: colors.actionActive,
    [tone.hover]: colors.actionHover,
  },
  small: { padding: '5px', fontSize: '1.125rem' },
  large: { padding: '12px', fontSize: '1.75rem' },
  edgeStart: { marginLeft: '-12px' },
  edgeStartSmall: { marginLeft: '-3px' },
  edgeEnd: { marginRight: '-12px' },
  edgeEndSmall: { marginRight: '-3px' },
  disabled: {
    cursor: 'default',
    pointerEvents: 'none',
    color: colors.actionDisabled,
    backgroundColor: 'transparent',
  },
})

/**
 * Round icon-only button (MUI IconButton). Give it an `aria-label`: the icon
 * inside is decorative.
 */
export function IconButton({
  color = 'default',
  size = 'medium',
  edge = false,
  disabled = false,
  href,
  target,
  rel,
  render,
  xstyle,
  ...props
}: IconButtonProps) {
  const element =
    render ??
    (href !== undefined ? (
      // biome-ignore lint/a11y/useAnchorContent: useRender supplies the children
      <a href={href} target={target} rel={rel} />
    ) : undefined)
  const styleProps = stylex.props(
    color === 'default' ? null : toneStyles[color],
    styles.base,
    color === 'default' && styles.default,
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    edge === 'start' &&
      (size === 'small' ? styles.edgeStartSmall : styles.edgeStart),
    edge === 'end' && (size === 'small' ? styles.edgeEndSmall : styles.edgeEnd),
    disabled && styles.disabled,
    xstyle,
  )
  const stateProps = element
    ? disabled
      ? { 'aria-disabled': true, 'data-disabled': '', tabIndex: -1 }
      : {}
    : { disabled }
  return useRender({
    render: element ?? <BaseButton />,
    props: mergeProps<'button'>(styleProps, stateProps, props),
  })
}
