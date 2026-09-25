import * as stylex from '@stylexjs/stylex'
import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import { colors } from '@/styles/tokens.stylex'

export interface AnchorProps
  extends Omit<ComponentProps<'a'>, 'className' | 'style' | 'color'> {
  /** Default `primary`. */
  color?:
    | 'primary'
    | 'inherit'
    | 'textPrimary'
    | 'textSecondary'
    | 'error'
    | undefined
  /** When to underline, as MUI Link. Default `always`. */
  underline?: 'always' | 'hover' | 'none' | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  root: {
    // MUI Link is `Typography variant="inherit"`.
    font: 'inherit',
    letterSpacing: 'inherit',
    cursor: 'pointer',
  },
  primary: {
    color: colors.primary,
    textDecorationColor: {
      default: `color-mix(in srgb, ${colors.primary} 40%, transparent)`,
      ':hover': 'inherit',
    },
  },
  inherit: { color: 'inherit' },
  textPrimary: { color: colors.textPrimary },
  textSecondary: { color: colors.textSecondary },
  error: {
    color: colors.error,
    textDecorationColor: {
      default: `color-mix(in srgb, ${colors.error} 40%, transparent)`,
      ':hover': 'inherit',
    },
  },
  always: { textDecorationLine: 'underline' },
  hover: { textDecorationLine: { default: 'none', ':hover': 'underline' } },
  none: { textDecorationLine: 'none' },
})

/**
 * Plain `<a>` styled like MUI Link, for external URLs (`href`). For app
 * routes use `Link`, which adds TanStack Router navigation.
 */
export function Anchor({
  color = 'primary',
  underline = 'always',
  xstyle,
  ...props
}: AnchorProps) {
  return (
    <a
      {...props}
      {...stylex.props(styles.root, styles[color], styles[underline], xstyle)}
    />
  )
}

const RouterAnchor = createLink(Anchor)

/**
 * Type-safe TanStack Router link styled like MUI Link:
 * `<Link to="/albums/$slug" params={{ slug }}>`.
 */
export const Link: LinkComponent<typeof Anchor> = (props) => (
  <RouterAnchor {...props} />
)
