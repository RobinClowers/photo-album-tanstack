// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Container } from './Container'
import { styleOf } from './test-utils'

describe('Container', () => {
  it('centers a lg column with gutters by default', () => {
    render(<Container data-testid="c">x</Container>)
    const el = screen.getByTestId('c')
    expect(styleOf(el, 'max-width')).toBe('1200px')
    expect(styleOf(el, 'margin-left')).toBe('auto')
    expect(styleOf(el, 'padding-left')).toBe('16px')
    expect(styleOf(el, 'box-sizing')).toBe('border-box')
  })

  it('supports MUI max widths and disableGutters', () => {
    render(
      <>
        <Container data-testid="xs" maxWidth="xs" />
        <Container data-testid="xl" maxWidth="xl" disableGutters />
        <Container data-testid="none" maxWidth={false} />
      </>,
    )
    expect(styleOf(screen.getByTestId('xs'), 'max-width')).toBe('444px')
    expect(styleOf(screen.getByTestId('xl'), 'max-width')).toBe('1536px')
    expect(styleOf(screen.getByTestId('xl'), 'padding-left')).toBe('')
    expect(styleOf(screen.getByTestId('none'), 'max-width')).toBe('')
  })

  it('renders another element via render', () => {
    render(<Container render={<main />}>content</Container>)
    expect(screen.getByRole('main').textContent).toBe('content')
  })
})
