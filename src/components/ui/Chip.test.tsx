// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Chip } from './Chip'
import { styleOf } from './test-utils'

describe('Chip', () => {
  it('renders a 32px rounded label', () => {
    render(<Chip label="done" data-testid="chip" />)
    const chip = screen.getByTestId('chip')
    expect(chip.textContent).toBe('done')
    expect(styleOf(chip, 'height')).toBe('32px')
    expect(styleOf(chip, 'border-radius')).toBe('16px')
    expect(styleOf(chip, 'background-color')).toBe('rgba(0, 0, 0, 0.08)')
    expect(styleOf(screen.getByText('done'), 'padding-left')).toBe('12px')
  })

  it('supports small outlined colored chips', () => {
    render(
      <Chip
        label="failed"
        size="small"
        variant="outlined"
        color="error"
        data-testid="chip"
      />,
    )
    const chip = screen.getByTestId('chip')
    expect(styleOf(chip, 'height')).toBe('24px')
    expect(styleOf(chip, 'border-top-width')).toBe('1px')
    expect(styleOf(chip, 'background-color')).toBe('rgba(0, 0, 0, 0)')
    expect(styleOf(chip, 'color')).toBe('#d32f2f')
    expect(styleOf(screen.getByText('failed'), 'padding-left')).toBe('7px')
  })

  it('fills with the palette color', () => {
    render(<Chip label="info" color="info" data-testid="chip" />)
    const chip = screen.getByTestId('chip')
    expect(styleOf(chip, 'background-color')).toBe('#0288d1')
    expect(styleOf(chip, 'color')).toBe('#fff')
  })
})
