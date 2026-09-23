// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { breakpoints, breakpointWidths } from './breakpoints.stylex'
import {
  colors,
  elevation,
  font,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  motion,
  radii,
  space,
  zIndex,
} from './tokens.stylex'

/** Resolves a compiled `var(--hash)` token to the value StyleX put on :root. */
function resolve(token: string): string {
  const name = /^var\((--[\w-]+)\)$/.exec(token)?.[1]
  if (!name) throw new Error(`not a CSS variable reference: ${token}`)
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

describe('tokens.stylex', () => {
  it('compiles every token to a CSS variable reference', () => {
    for (const group of [colors, space, radii, elevation, font, motion]) {
      for (const [key, value] of Object.entries(group)) {
        if (key === '__varGroupHash__') continue
        expect(value).toMatch(/^var\(--[\w-]+\)$/)
      }
    }
  })

  it('matches the MUI default palette', () => {
    expect(resolve(colors.primary)).toBe('#1976d2')
    expect(resolve(colors.primaryDark)).toBe('#1565c0')
    expect(resolve(colors.onPrimary)).toBe('#fff')
    expect(resolve(colors.secondary)).toBe('#9c27b0')
    expect(resolve(colors.error)).toBe('#d32f2f')
    expect(resolve(colors.warning)).toBe('#ed6c02')
    expect(resolve(colors.info)).toBe('#0288d1')
    expect(resolve(colors.success)).toBe('#2e7d32')
    expect(resolve(colors.grey100)).toBe('#f5f5f5')
    expect(resolve(colors.grey500)).toBe('#9e9e9e')
    expect(resolve(colors.textPrimary)).toBe('rgba(0, 0, 0, 0.87)')
    expect(resolve(colors.textSecondary)).toBe('rgba(0, 0, 0, 0.6)')
    expect(resolve(colors.divider)).toBe('rgba(0, 0, 0, 0.12)')
    expect(resolve(colors.backgroundPaper)).toBe('#fff')
    expect(resolve(colors.actionHover)).toBe('rgba(0, 0, 0, 0.04)')
  })

  it('uses the MUI 8px spacing grid and 4px shape radius', () => {
    expect(resolve(space.s0_5)).toBe('4px')
    expect(resolve(space.s1)).toBe('8px')
    expect(resolve(space.s1_5)).toBe('12px')
    expect(resolve(space.s2)).toBe('16px')
    expect(resolve(space.s3)).toBe('24px')
    expect(resolve(space.s8)).toBe('64px')
    expect(resolve(radii.sm)).toBe('4px')
  })

  it('matches MUI elevation shadows', () => {
    expect(resolve(elevation.e0)).toBe('none')
    expect(resolve(elevation.e1)).toBe(
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    )
    expect(resolve(elevation.e8)).toBe(
      '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    )
    expect(resolve(elevation.e24)).toBe(
      '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
    )
  })

  it('matches the MUI type scale', () => {
    expect(resolve(font.family)).toBe(
      '"Roboto", "Helvetica", "Arial", sans-serif',
    )
    expect(resolve(fontSize.h4)).toBe('2.125rem')
    expect(resolve(lineHeight.h4)).toBe('1.235')
    expect(resolve(letterSpacing.h4)).toBe('0.00735em')
    expect(resolve(fontWeight.h4)).toBe('400')
    expect(resolve(fontSize.body2)).toBe('0.875rem')
    expect(resolve(lineHeight.body2)).toBe('1.43')
    expect(resolve(fontWeight.h6)).toBe('500')
    expect(resolve(letterSpacing.button)).toBe('0.02857em')
    expect(resolve(lineHeight.overline)).toBe('2.66')
  })

  it('matches MUI transitions and z-index', () => {
    expect(resolve(motion.durationShorter)).toBe('200ms')
    expect(resolve(motion.easeInOut)).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    expect(resolve(zIndex.appBar)).toBe('1100')
    expect(resolve(zIndex.tooltip)).toBe('1500')
  })
})

describe('breakpoints.stylex', () => {
  it('matches MUI breakpoints.up()', () => {
    expect(breakpoints.smUp).toBe('@media (min-width: 600px)')
    expect(breakpoints.mdUp).toBe('@media (min-width: 900px)')
    expect(breakpoints.lgUp).toBe('@media (min-width: 1200px)')
    expect(breakpoints.xlUp).toBe('@media (min-width: 1536px)')
  })

  it('matches MUI breakpoints.down()', () => {
    expect(breakpoints.smDown).toBe('@media (max-width: 599.95px)')
    expect(breakpoints.mdDown).toBe('@media (max-width: 899.95px)')
    expect(breakpoints.lgDown).toBe('@media (max-width: 1199.95px)')
    expect(breakpoints.xlDown).toBe('@media (max-width: 1535.95px)')
  })

  it('exposes breakpoint widths', () => {
    expect(breakpointWidths).toEqual({
      sm: '600px',
      md: '900px',
      lg: '1200px',
      xl: '1536px',
    })
  })
})
