// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Anchor, Link } from './Link'
import { renderWithRouter, styleOf } from './test-utils'

describe('Anchor', () => {
  it('renders an underlined primary link', () => {
    render(
      <Anchor href="https://example.com" target="_blank" rel="noreferrer">
        Open it again
      </Anchor>,
    )
    const link = screen.getByRole('link', { name: 'Open it again' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(styleOf(link, 'color')).toBe('#1976d2')
    expect(styleOf(link, 'text-decoration-line')).toBe('underline')
  })

  it('supports color and underline options', () => {
    render(
      <div style={{ color: 'rgb(1, 2, 3)' }}>
        <Anchor href="/x" color="inherit" underline="none">
          Quiet
        </Anchor>
      </div>,
    )
    const link = screen.getByRole('link', { name: 'Quiet' })
    expect(styleOf(link, 'color')).toBe('rgb(1, 2, 3)')
    expect(styleOf(link, 'text-decoration-line')).toBe('none')
  })
})

describe('Link', () => {
  it('navigates with typed params', async () => {
    renderWithRouter(
      <Link to="/admin/imports/$id" params={{ id: '42' }} underline="hover">
        import page
      </Link>,
    )
    const link = await screen.findByRole('link', { name: 'import page' })
    expect(link.getAttribute('href')).toBe('/admin/imports/42')
    expect(styleOf(link, 'text-decoration-line')).toBe('none')
  })

  it('marks the active route', async () => {
    renderWithRouter(<Link to="/">Home</Link>, '/')
    const link = await screen.findByRole('link', { name: 'Home' })
    expect(link.getAttribute('data-status')).toBe('active')
  })
})
