import * as stylex from '@stylexjs/stylex'
import type { ComponentProps, ReactNode } from 'react'
import { colors, font } from '@/styles/tokens.stylex'
import type { PaletteColor } from './tone'
import { toneStyles } from './tone'
import { tone } from './tone.stylex'

export interface ChipProps
  extends Omit<ComponentProps<'div'>, 'className' | 'style' | 'color'> {
  label: ReactNode
  /** `default` is neutral grey. Default `default`. */
  color?: PaletteColor | 'default' | undefined
  /** Default `filled`. */
  variant?: 'filled' | 'outlined' | undefined
  /** 24px (small) or 32px (medium) tall. Default `medium`. */
  size?: 'small' | 'medium' | undefined
  xstyle?: stylex.StyleXStyles | undefined
}

const styles = stylex.create({
  root: {
    maxWidth: '100%',
    fontFamily: font.family,
    fontSize: '0.8125rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '32px',
    lineHeight: 1.5,
    color: colors.textPrimary,
    backgroundColor: colors.actionSelected,
    borderRadius: '16px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    boxSizing: 'border-box',
    borderWidth: 0,
    borderStyle: 'solid',
    padding: 0,
    outlineWidth: 0,
  },
  small: { height: '24px' },
  filledColor: { backgroundColor: tone.main, color: tone.contrast },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: '1px',
    borderColor: colors.grey400,
  },
  outlinedColor: {
    color: tone.main,
    borderColor: `color-mix(in srgb, ${tone.main} 70%, transparent)`,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingLeft: '12px',
    paddingRight: '12px',
  },
  labelSmall: { paddingLeft: '8px', paddingRight: '8px' },
  labelOutlined: { paddingLeft: '11px', paddingRight: '11px' },
  labelOutlinedSmall: { paddingLeft: '7px', paddingRight: '7px' },
})

/** Compact status label (MUI `Chip`, non-interactive). */
export function Chip({
  label,
  color = 'default',
  variant = 'filled',
  size = 'medium',
  xstyle,
  ...props
}: ChipProps) {
  const colored = color !== 'default'
  const outlined = variant === 'outlined'
  const small = size === 'small'
  return (
    <div
      {...props}
      {...stylex.props(
        colored && toneStyles[color],
        styles.root,
        small && styles.small,
        colored && !outlined && styles.filledColor,
        outlined && styles.outlined,
        outlined && colored && styles.outlinedColor,
        xstyle,
      )}
    >
      <span
        {...stylex.props(
          styles.label,
          small && styles.labelSmall,
          outlined && styles.labelOutlined,
          outlined && small && styles.labelOutlinedSmall,
        )}
      >
        {label}
      </span>
    </div>
  )
}
