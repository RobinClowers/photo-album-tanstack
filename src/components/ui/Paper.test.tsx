// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card, CardActions, CardContent, CardMedia, Paper } from './Paper'
import { styleOf } from './test-utils'

const E1 =
  '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)'
const E8 =
  '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)'

/** The dynamic shadow is an inline var pointing at an elevation token. */
function shadowOf(el: HTMLElement) {
  const ref = /var\((--[\w-]+)\)/.exec(el.getAttribute('style') ?? '')?.[1]
  return ref
    ? getComputedStyle(document.documentElement).getPropertyValue(ref).trim()
    : ''
}

describe('Paper', () => {
  it('has the paper background, 4px radius and elevation 1 by default', () => {
    render(<Paper data-testid="p" />)
    const el = screen.getByTestId('p')
    expect(styleOf(el, 'background-color')).toBe('#fff')
    expect(styleOf(el, 'border-radius')).toBe('4px')
    expect(shadowOf(el)).toBe(E1)
  })

  it('supports elevation, square and outlined', () => {
    render(
      <>
        <Paper data-testid="e8" elevation={8} square />
        <Paper data-testid="o" variant="outlined" />
      </>,
    )
    const e8 = screen.getByTestId('e8')
    expect(shadowOf(e8)).toBe(E8)
    expect(styleOf(e8, 'border-radius')).toBe('0')
    const outlined = screen.getByTestId('o')
    expect(styleOf(outlined, 'border-top-width')).toBe('1px')
    expect(outlined.getAttribute('style')).toBeNull()
  })

  it('renders as a form via render', () => {
    render(<Paper render={<form aria-label="New album" />} />)
    expect(screen.getByRole('form', { name: 'New album' })).toBeTruthy()
  })
})

describe('Card', () => {
  it('clips content and lays out media, content and actions', () => {
    render(
      <Card data-testid="card">
        <CardMedia src="/a.jpg" alt="Cover" height={180} />
        <CardContent data-testid="content">Body</CardContent>
        <CardActions data-testid="actions">Buttons</CardActions>
      </Card>,
    )
    expect(styleOf(screen.getByTestId('card'), 'overflow')).toBe('hidden')
    const img = screen.getByRole('img', { name: 'Cover' })
    expect(styleOf(img, 'object-fit')).toBe('cover')
    expect(styleOf(img, 'width')).toBe('100%')
    expect(styleOf(screen.getByTestId('content'), 'padding-bottom')).toBe(
      '16px',
    )
    expect(styleOf(screen.getByTestId('actions'), 'gap')).toBe('8px')
  })

  it('gives the last CardContent 24px bottom padding', () => {
    render(
      <Card>
        <CardContent data-testid="last">Body</CardContent>
      </Card>,
    )
    expect(styleOf(screen.getByTestId('last'), 'padding-bottom')).toBe('24px')
  })
})
