import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { CSSProperties, ReactElement } from 'react'
import { breakpoints } from '@/styles/breakpoints.stylex'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** A value, or per-breakpoint values (mobile first, like MUI's `sx`). */
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>

export type StackDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'

export interface StackProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** Default `column`. */
  direction?: Responsive<StackDirection> | undefined
  /** Gap in MUI spacing units (8px each), e.g. `2` is 16px. Default 0. */
  gap?: Responsive<number> | undefined
  align?: CSSProperties['alignItems'] | undefined
  justify?: CSSProperties['justifyContent'] | undefined
  wrap?: boolean | undefined
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

type PerBreakpoint<T> = [xs: T, sm: T, md: T, lg: T, xl: T]

/**
 * Resolves a responsive value to one value per breakpoint (xs, sm, md, lg,
 * xl), carrying each value up to larger breakpoints until overridden
 * (mobile first).
 */
export function cascade<T>(
  value: Responsive<T>,
  fallback: T,
): PerBreakpoint<T> {
  if (typeof value !== 'object' || value === null) {
    const scalar = value as T
    return [scalar, scalar, scalar, scalar, scalar]
  }
  const { xs, sm, md, lg, xl } = value as Partial<Record<Breakpoint, T>>
  const rXs = xs ?? fallback
  const rSm = sm ?? rXs
  const rMd = md ?? rSm
  const rLg = lg ?? rMd
  return [rXs, rSm, rMd, rLg, xl ?? rLg]
}

const styles = stylex.create({
  root: { display: 'flex', minWidth: 0 },
  wrap: { flexWrap: 'wrap' },
  // Dynamic styles: values are set as inline CSS variables, the media
  // queries live in the (static) generated rules.
  direction: (
    xs: StackDirection,
    sm: StackDirection,
    md: StackDirection,
    lg: StackDirection,
    xl: StackDirection,
  ) => ({
    flexDirection: {
      default: xs,
      [breakpoints.smUp]: sm,
      [breakpoints.mdUp]: md,
      [breakpoints.lgUp]: lg,
      [breakpoints.xlUp]: xl,
    },
  }),
  gap: (xs: string, sm: string, md: string, lg: string, xl: string) => ({
    gap: {
      default: xs,
      [breakpoints.smUp]: sm,
      [breakpoints.mdUp]: md,
      [breakpoints.lgUp]: lg,
      [breakpoints.xlUp]: xl,
    },
  }),
  align: (value: NonNullable<CSSProperties['alignItems']>) => ({
    alignItems: value,
  }),
  justify: (value: NonNullable<CSSProperties['justifyContent']>) => ({
    justifyContent: value,
  }),
})

const px = (units: number) => `${units * 8}px`

/** One-dimensional flex layout (MUI `Stack`) with gap-based spacing. */
export function Stack({
  direction = 'column',
  gap = 0,
  align,
  justify,
  wrap = false,
  render,
  xstyle,
  ...props
}: StackProps) {
  const [dXs, dSm, dMd, dLg, dXl] = cascade<StackDirection>(direction, 'column')
  const [gXs, gSm, gMd, gLg, gXl] = cascade(gap, 0)
  return useRender({
    render,
    props: mergeProps<'div'>(
      stylex.props(
        styles.root,
        styles.direction(dXs, dSm, dMd, dLg, dXl),
        styles.gap(px(gXs), px(gSm), px(gMd), px(gLg), px(gXl)),
        align !== undefined && styles.align(align),
        justify !== undefined && styles.justify(justify),
        wrap && styles.wrap,
        xstyle,
      ),
      props,
    ),
  })
}
