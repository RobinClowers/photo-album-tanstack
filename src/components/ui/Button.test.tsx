// @vitest-environment jsdom
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { OpenInNewIcon } from './Icon'
import { renderWithRouter, styleOf, varName } from './test-utils'
import { tone } from './tone.stylex'

const overrides = stylex.create({ margin: { marginLeft: '8px' } })

describe('Button', () => {
  it('renders a native button with MUI text-button metrics', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')
    const style = getComputedStyle(button)
    expect(style.padding).toBe('6px 8px')
    expect(style.textTransform).toBe('uppercase')
    expect(style.minWidth).toBe('64px')
  })

  it('applies variant and size padding', () => {
    render(
      <>
        <Button variant="outlined">Outlined</Button>
        <Button variant="contained" size="small">
          Small
        </Button>
        <Button variant="contained" size="large">
          Large
        </Button>
      </>,
    )
    const outlined = getComputedStyle(
      screen.getByRole('button', { name: 'Outlined' }),
    )
    expect(outlined.padding).toBe('5px 15px')
    expect(outlined.borderTopWidth).toBe('1px')
    expect(outlined.borderTopStyle).toBe('solid')
    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Small' })).padding,
    ).toBe('4px 10px')
    const large = getComputedStyle(
      screen.getByRole('button', { name: 'Large' }),
    )
    expect(large.padding).toBe('8px 22px')
    expect(large.fontSize).toBe('0.9375rem')
  })

  it('calls onClick and supports keyboard activation', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    const button = screen.getByRole('button', { name: 'Go' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('disables the native button', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Nope' })
    expect(button).toHaveProperty('disabled', true)
    expect(getComputedStyle(button).pointerEvents).toBe('none')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('submits forms when type="submit"', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send</Button>
      </form>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders start and end icons', () => {
    render(
      <Button startIcon={<OpenInNewIcon />} endIcon={<OpenInNewIcon />}>
        Open
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Open' })
    const icons = button.querySelectorAll('svg')
    expect(icons).toHaveLength(2)
    const start = icons[0]?.parentElement as HTMLElement
    expect(getComputedStyle(start).marginRight).toBe('8px')
    expect(getComputedStyle(start).marginLeft).toBe('-4px')
  })

  it('renders an anchor with href', () => {
    render(
      <Button href="/api/auth/google/login" variant="contained">
        Sign in
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Sign in' })
    expect(link.getAttribute('href')).toBe('/api/auth/google/login')
    expect(getComputedStyle(link).padding).toBe('6px 16px')
  })

  it('renders as a router Link via render', async () => {
    renderWithRouter(
      <Button render={<Link to="/admin/imports" />}>Imports</Button>,
    )
    const link = await screen.findByRole('link', { name: 'Imports' })
    expect(link.getAttribute('href')).toBe('/admin/imports')
    expect(link.hasAttribute('disabled')).toBe(false)
  })

  it('marks a disabled link aria-disabled and removes it from tab order', () => {
    render(
      <Button href="/x" disabled>
        Link
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link.getAttribute('aria-disabled')).toBe('true')
    expect(link.getAttribute('tabindex')).toBe('-1')
  })

  it('applies fullWidth and caller xstyle overrides', () => {
    render(
      <>
        <Button fullWidth>Wide</Button>
        <Button xstyle={overrides.margin}>Spaced</Button>
      </>,
    )
    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Wide' })).width,
    ).toBe('100%')
    expect(
      getComputedStyle(screen.getByRole('button', { name: 'Spaced' }))
        .marginLeft,
    ).toBe('8px')
  })

  it('paints contained buttons with the palette main and contrast colors', () => {
    render(
      <>
        <Button variant="contained">Primary</Button>
        <Button variant="contained" color="error">
          Danger
        </Button>
        <Button variant="contained" color="success">
          Ok
        </Button>
      </>,
    )
    const primary = screen.getByRole('button', { name: 'Primary' })
    expect(styleOf(primary, 'background-color')).toBe('#1976d2')
    expect(styleOf(primary, 'color')).toBe('#fff')
    const danger = screen.getByRole('button', { name: 'Danger' })
    expect(styleOf(danger, 'background-color')).toBe('#d32f2f')
    expect(styleOf(danger, 'color')).toBe('#fff')
    const ok = screen.getByRole('button', { name: 'Ok' })
    expect(styleOf(ok, 'background-color')).toBe('#2e7d32')
  })

  it('paints text and outlined buttons with the palette main color', () => {
    render(
      <>
        <Button>Text</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="outlined" color="error">
          Remove
        </Button>
      </>,
    )
    const text = screen.getByRole('button', { name: 'Text' })
    expect(styleOf(text, 'color')).toBe('#1976d2')
    expect(styleOf(text, 'background-color')).toBe('rgba(0, 0, 0, 0)')
    const outlined = screen.getByRole('button', { name: 'Outlined' })
    expect(styleOf(outlined, 'color')).toBe('#1976d2')
    const remove = screen.getByRole('button', { name: 'Remove' })
    expect(styleOf(remove, 'color')).toBe('#d32f2f')
    // jsdom cannot cascade `border-color: var(...)`, so check the tone var
    // that `styles.outlined` reads for its border.
    expect(styleOf(remove, varName(tone.border))).toBe(
      'color-mix(in srgb,#d32f2f 50%,transparent)',
    )
    expect(styleOf(outlined, varName(tone.border))).toBe(
      'color-mix(in srgb,#1976d2 50%,transparent)',
    )
  })

  it('paints color="inherit" contained buttons grey', () => {
    render(
      <Button variant="contained" color="inherit">
        Grey
      </Button>,
    )
    const grey = screen.getByRole('button', { name: 'Grey' })
    expect(styleOf(grey, 'background-color')).toBe('#e0e0e0')
    expect(styleOf(grey, 'color')).toBe('rgba(0, 0, 0, 0.87)')
  })

  it('greys out disabled contained and outlined buttons', () => {
    render(
      <>
        <Button variant="contained" disabled>
          Filled
        </Button>
        <Button variant="outlined" disabled>
          Framed
        </Button>
      </>,
    )
    const filled = screen.getByRole('button', { name: 'Filled' })
    expect(styleOf(filled, 'background-color')).toBe('rgba(0, 0, 0, 0.12)')
    expect(styleOf(filled, 'color')).toBe('rgba(0, 0, 0, 0.26)')
    expect(styleOf(filled, 'box-shadow')).toBe('none')
    const framed = screen.getByRole('button', { name: 'Framed' })
    expect(styleOf(framed, 'color')).toBe('rgba(0, 0, 0, 0.26)')
  })
})
