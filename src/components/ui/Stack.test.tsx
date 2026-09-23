// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { cascade, Stack } from './Stack'
import { styleOf } from './test-utils'

describe('Stack', () => {
  it('is a column flexbox with gap in 8px units', () => {
    render(
      <Stack data-testid="s" gap={2} align="center" justify="space-between">
        <span>a</span>
      </Stack>,
    )
    const el = screen.getByTestId('s')
    expect(styleOf(el, 'display')).toBe('flex')
    const inline = el.getAttribute('style') ?? ''
    expect(inline).toContain('column')
    expect(inline).toContain('16px')
    expect(inline).toContain('center')
    expect(inline).toContain('space-between')
  })

  it('cascades responsive values mobile first', () => {
    expect(cascade({ xs: 'column', md: 'row' }, 'column')).toEqual([
      'column',
      'column',
      'row',
      'row',
      'row',
    ])
    expect(cascade({ sm: 3 }, 0)).toEqual([0, 3, 3, 3, 3])
    expect(cascade(1, 0)).toEqual([1, 1, 1, 1, 1])
  })

  it('emits a value per breakpoint for responsive props', () => {
    render(
      <Stack
        data-testid="s"
        direction={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1, md: 3 }}
      />,
    )
    const inline = screen.getByTestId('s').getAttribute('style') ?? ''
    expect(inline.match(/row/g)).toHaveLength(4)
    expect(inline.match(/8px/g)).toHaveLength(2)
    expect(inline.match(/24px/g)).toHaveLength(3)
  })
})
