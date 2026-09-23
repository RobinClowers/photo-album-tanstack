import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as stylex from '@stylexjs/stylex'
import type { ReactElement } from 'react'
import {
  colors,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} from '@/styles/tokens.stylex'

export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'subtitle1'
  | 'subtitle2'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overline'

export type TextColor =
  | 'textPrimary'
  | 'textSecondary'
  | 'textDisabled'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'inherit'

type TextTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'span'
  | 'div'
  | 'label'
  | 'legend'
  | 'strong'
  | 'em'
  | 'figcaption'

export interface TextProps
  extends Omit<useRender.ComponentProps<'p'>, 'className' | 'style' | 'color'> {
  /** MUI Typography variant. Default `body1`. */
  variant?: TextVariant | undefined
  /** Element to render; defaults follow MUI's variant mapping (body → p). */
  as?: TextTag | undefined
  /** Render as another element or component, e.g. `render={<Link to="/" />}`. */
  render?: ReactElement | undefined
  /** Text color. Default: inherited. */
  color?: TextColor | undefined
  align?: 'left' | 'center' | 'right' | 'justify' | undefined
  /** `margin-bottom: 0.35em`. */
  gutterBottom?: boolean | undefined
  /** Paragraph spacing: `margin-bottom: 16px`. */
  paragraph?: boolean | undefined
  /** Single line with an ellipsis. */
  noWrap?: boolean | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

/** MUI's default `variantMapping`. */
const DEFAULT_TAG: Record<TextVariant, TextTag> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
}

const styles = stylex.create({
  base: { margin: 0, fontFamily: font.family },
  h1: {
    fontSize: fontSize.h1,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.h1,
    fontWeight: fontWeight.h1,
  },
  h2: {
    fontSize: fontSize.h2,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.h2,
    fontWeight: fontWeight.h2,
  },
  h3: {
    fontSize: fontSize.h3,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.h3,
    fontWeight: fontWeight.h3,
  },
  h4: {
    fontSize: fontSize.h4,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.h4,
    fontWeight: fontWeight.h4,
  },
  h5: {
    fontSize: fontSize.h5,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.h5,
    fontWeight: fontWeight.h5,
  },
  h6: {
    fontSize: fontSize.h6,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.h6,
    fontWeight: fontWeight.h6,
  },
  subtitle1: {
    fontSize: fontSize.subtitle1,
    lineHeight: lineHeight.subtitle1,
    letterSpacing: letterSpacing.subtitle1,
    fontWeight: fontWeight.subtitle1,
  },
  subtitle2: {
    fontSize: fontSize.subtitle2,
    lineHeight: lineHeight.subtitle2,
    letterSpacing: letterSpacing.subtitle2,
    fontWeight: fontWeight.subtitle2,
  },
  body1: {
    fontSize: fontSize.body1,
    lineHeight: lineHeight.body1,
    letterSpacing: letterSpacing.body1,
    fontWeight: fontWeight.body1,
  },
  body2: {
    fontSize: fontSize.body2,
    lineHeight: lineHeight.body2,
    letterSpacing: letterSpacing.body2,
    fontWeight: fontWeight.body2,
  },
  caption: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.caption,
    fontWeight: fontWeight.caption,
  },
  overline: {
    fontSize: fontSize.overline,
    lineHeight: lineHeight.overline,
    letterSpacing: letterSpacing.overline,
    fontWeight: fontWeight.overline,
    textTransform: 'uppercase',
  },
  textPrimary: { color: colors.textPrimary },
  textSecondary: { color: colors.textSecondary },
  textDisabled: { color: colors.textDisabled },
  primary: { color: colors.primary },
  secondary: { color: colors.secondary },
  error: { color: colors.error },
  warning: { color: colors.warning },
  info: { color: colors.info },
  success: { color: colors.success },
  inherit: { color: 'inherit' },
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' },
  gutterBottom: { marginBottom: '0.35em' },
  paragraph: { marginBottom: '16px' },
  noWrap: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

/** Typography (MUI `Typography` replacement). */
export function Text({
  variant = 'body1',
  as,
  render,
  color,
  align,
  gutterBottom = false,
  paragraph = false,
  noWrap = false,
  xstyle,
  ...props
}: TextProps) {
  return useRender({
    defaultTagName: as ?? (paragraph ? 'p' : DEFAULT_TAG[variant]),
    render,
    props: mergeProps<'p'>(
      stylex.props(
        styles.base,
        styles[variant],
        color && styles[color],
        align && styles[align],
        gutterBottom && styles.gutterBottom,
        paragraph && styles.paragraph,
        noWrap && styles.noWrap,
        xstyle,
      ),
      props,
    ),
  })
}
