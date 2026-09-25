// @vitest-environment jsdom
import * as stylex from '@stylexjs/stylex'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { breakpoints } from '@/styles/breakpoints.stylex'
import { colors, space } from '@/styles/tokens.stylex'

// Proves vitest compiles StyleX (stylex.create would throw at runtime
// otherwise) and injects the rules, so component tests can assert styles.

const styles = stylex.create({
  box: {
    display: 'flex',
    marginTop: '5px',
    paddingTop: space.s2,
    color: colors.primary,
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    width: { default: '100px', [breakpoints.smUp]: '200px' },
  },
  override: {
    marginTop: '7px',
  },
  dropped: {
    // biome-ignore lint/plugin/no-stylex-border-shorthand: demonstrates why the rule exists
    borderBottom: '3px solid red',
  },
})

function Box({ xstyle }: { xstyle?: stylex.StyleXStyles }) {
  return (
    <div data-testid="box" {...stylex.props(styles.box, xstyle)}>
      box
    </div>
  )
}

describe('StyleX under vitest', () => {
  it('applies compiled atomic classes to a rendered component', () => {
    render(<Box />)
    const box = screen.getByTestId('box')
    const computed = getComputedStyle(box)
    expect(computed.display).toBe('flex')
    expect(computed.marginTop).toBe('5px')
    expect(computed.borderTopWidth).toBe('2px')
    expect(computed.borderTopStyle).toBe('solid')
  })

  it('references tokens as CSS variables', () => {
    render(<Box />)
    const box = screen.getByTestId('box')
    expect(getComputedStyle(box).color).toBe(colors.primary)
    expect(colors.primary).toMatch(/^var\(--[\w-]+\)$/)
    expect(getComputedStyle(box).paddingTop).toBe(space.s2)
  })

  it('lets a later caller style override an earlier one', () => {
    render(<Box xstyle={styles.override} />)
    expect(getComputedStyle(screen.getByTestId('box')).marginTop).toBe('7px')
  })

  it('silently drops border shorthands (hence the Biome guard)', () => {
    const { className = '' } = stylex.props(styles.dropped)
    // Only the dev-mode debug class remains; no atomic class was generated.
    expect(className.split(' ')).toEqual(['stylex__styles.dropped'])
  })
})
