// @vitest-environment jsdom
import { Link } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DeleteIcon, HomeIcon } from './Icon'
import { IconButton } from './IconButton'
import { renderWithRouter, styleOf } from './test-utils'

describe('IconButton', () => {
  it('renders a round native button labelled by aria-label', () => {
    const onClick = vi.fn()
    render(
      <IconButton aria-label="Delete photo" onClick={onClick}>
        <DeleteIcon />
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Delete photo' })
    expect(button.getAttribute('type')).toBe('button')
    const style = getComputedStyle(button)
    expect(style.padding).toBe('8px')
    expect(styleOf(button, 'border-radius')).toBe('50%')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies sizes and edge offsets', () => {
    render(
      <>
        <IconButton aria-label="small" size="small" edge="end">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="large" size="large" edge="start">
          <DeleteIcon />
        </IconButton>
      </>,
    )
    const small = getComputedStyle(
      screen.getByRole('button', { name: 'small' }),
    )
    expect(small.padding).toBe('5px')
    expect(small.marginRight).toBe('-3px')
    const large = getComputedStyle(
      screen.getByRole('button', { name: 'large' }),
    )
    expect(large.padding).toBe('12px')
    expect(large.marginLeft).toBe('-12px')
  })

  it('disables the button', () => {
    render(
      <IconButton aria-label="Off" disabled>
        <DeleteIcon />
      </IconButton>,
    )
    expect(screen.getByRole('button', { name: 'Off' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('renders an anchor with href', () => {
    render(
      <IconButton
        href="/albums/summer"
        target="_blank"
        rel="noreferrer"
        aria-label="View public page"
      >
        <DeleteIcon />
      </IconButton>,
    )
    const link = screen.getByRole('link', { name: 'View public page' })
    expect(link.getAttribute('href')).toBe('/albums/summer')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noreferrer')
  })

  it('renders as a router link', async () => {
    renderWithRouter(
      <IconButton aria-label="Home" render={<Link to="/" />} color="inherit">
        <HomeIcon />
      </IconButton>,
    )
    const link = await screen.findByRole('link', { name: 'Home' })
    expect(link.getAttribute('href')).toBe('/')
    expect(styleOf(link, 'color')).toBe('currentColor')
  })

  it('paints the default grey, palette colors and inherit', () => {
    render(
      <div style={{ color: 'rgb(1, 2, 3)' }}>
        <IconButton aria-label="default">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="error" color="error">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="primary" color="primary">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="inherit" color="inherit">
          <DeleteIcon />
        </IconButton>
        <IconButton aria-label="disabled" color="error" disabled>
          <DeleteIcon />
        </IconButton>
      </div>,
    )
    const color = (name: string) =>
      styleOf(screen.getByRole('button', { name }), 'color')
    expect(color('default')).toBe('rgba(0, 0, 0, 0.54)')
    expect(color('error')).toBe('#d32f2f')
    expect(color('primary')).toBe('#1976d2')
    expect(color('inherit')).toBe('currentColor')
    expect(color('disabled')).toBe('rgba(0, 0, 0, 0.26)')
  })
})
