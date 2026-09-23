import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactElement } from 'react'
import { colors, elevation, motion, radii, space } from '@/styles/tokens.stylex'

/** MUI elevations 0-24 (`theme.shadows[n]`). */
export type Elevation =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24

export interface PaperProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  /** `elevation` casts a shadow; `outlined` draws a divider border. Default `elevation`. */
  variant?: 'elevation' | 'outlined' | undefined
  /** Shadow depth for the `elevation` variant. Default 1. */
  elevation?: Elevation | undefined
  /** No rounded corners. */
  square?: boolean | undefined
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  paper: {
    backgroundColor: colors.backgroundPaper,
    color: colors.textPrimary,
    borderRadius: radii.sm,
    transitionProperty: 'box-shadow',
    transitionDuration: motion.durationStandard,
    transitionTimingFunction: motion.easeInOut,
  },
  square: { borderRadius: 0 },
  outlined: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.divider,
  },
  shadow: (shadow: string) => ({ boxShadow: shadow }),
  card: { overflow: 'hidden' },
  media: {
    display: 'block',
    width: '100%',
    objectFit: 'cover',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  content: {
    padding: space.s2,
    paddingBottom: { default: space.s2, ':last-child': space.s3 },
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: space.s1,
    padding: space.s1,
  },
})

const shadowFor = (level: Elevation) =>
  elevation[`e${level}` as keyof typeof elevation] as string

/** Paper's styles, for components that render as a Paper (e.g. TableContainer). */
export function paperStyles(
  variant: PaperProps['variant'] = 'elevation',
  level: Elevation = 1,
  square = false,
) {
  return [
    styles.paper,
    variant === 'outlined' ? styles.outlined : styles.shadow(shadowFor(level)),
    square && styles.square,
  ]
}

/** Surface with MUI's paper background, radius and elevation shadow. */
export function Paper({
  variant = 'elevation',
  elevation: level = 1,
  square = false,
  render,
  xstyle,
  ...props
}: PaperProps) {
  return useRender({
    render,
    props: mergeProps<'div'>(
      stylex.props(paperStyles(variant, level, square), xstyle),
      props,
    ),
  })
}

/** Paper that clips its media (MUI `Card`). */
export function Card({
  variant = 'elevation',
  elevation: level = 1,
  square = false,
  render,
  xstyle,
  ...props
}: PaperProps) {
  return useRender({
    render,
    props: mergeProps<'div'>(
      stylex.props(paperStyles(variant, level, square), styles.card, xstyle),
      props,
    ),
  })
}

export interface CardMediaProps
  extends Omit<ComponentProps<'img'>, 'className' | 'style'> {
  xstyle?: stylex.StyleXStyles | undefined
}

/** Full-width card image (MUI `CardMedia component="img"`). */
export function CardMedia({ xstyle, alt = '', ...props }: CardMediaProps) {
  return <img alt={alt} {...props} {...stylex.props(styles.media, xstyle)} />
}

export interface CardSectionProps
  extends Omit<useRender.ComponentProps<'div'>, 'className' | 'style'> {
  render?: ReactElement | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

/** 16px padded card body; the last one gets 24px bottom padding, as in MUI. */
export function CardContent({ render, xstyle, ...props }: CardSectionProps) {
  return useRender({
    render,
    props: mergeProps<'div'>(stylex.props(styles.content, xstyle), props),
  })
}

/** Row of card actions with 8px padding and spacing. */
export function CardActions({ render, xstyle, ...props }: CardSectionProps) {
  return useRender({
    render,
    props: mergeProps<'div'>(stylex.props(styles.actions, xstyle), props),
  })
}
