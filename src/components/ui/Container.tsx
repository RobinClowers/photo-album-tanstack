import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import { breakpoints, breakpointWidths } from '@/styles/breakpoints.stylex'
import { space } from '@/styles/tokens.stylex'

export type ContainerMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false

export interface ContainerProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** MUI Container max widths: xs 444px, sm 600, md 900, lg 1200, xl 1536. Default `lg`. */
  maxWidth?: ContainerMaxWidth | undefined
  /** Drop the 16px / 24px (sm+) side padding. */
  disableGutters?: boolean | undefined
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  root: {
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    boxSizing: 'border-box',
  },
  gutters: {
    paddingLeft: { default: space.s2, [breakpoints.smUp]: space.s3 },
    paddingRight: { default: space.s2, [breakpoints.smUp]: space.s3 },
  },
  xs: { maxWidth: '444px' },
  sm: { maxWidth: breakpointWidths.sm },
  md: { maxWidth: breakpointWidths.md },
  lg: { maxWidth: breakpointWidths.lg },
  xl: { maxWidth: breakpointWidths.xl },
})

/** Centered, max-width page column (MUI `Container`). */
export function Container({
  maxWidth = 'lg',
  disableGutters = false,
  render,
  xstyle,
  ...props
}: ContainerProps) {
  return useRender({
    render,
    props: mergeProps<'div'>(
      stylex.props(
        styles.root,
        !disableGutters && styles.gutters,
        maxWidth && styles[maxWidth],
        xstyle,
      ),
      props,
    ),
  })
}
