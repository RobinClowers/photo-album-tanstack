// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, styleOf } from '@/components/ui/test-utils'
import { Header } from './Header'

describe('Header', () => {
  it('renders the primary app bar with a home link and the site title', async () => {
    renderWithRouter(<Header />, '/privacy')
    const home = await screen.findByRole('link', { name: 'Home' })
    expect(home.getAttribute('href')).toBe('/')
    expect(home.querySelector('svg[data-icon="Home"]')).not.toBeNull()
    // IconButton edge="start" plus the 16px gap before the title.
    expect(getComputedStyle(home).marginLeft).toBe('-12px')
    expect(styleOf(home, 'margin-right')).toBe('16px')

    const bar = screen.getByRole('banner')
    expect(bar.tagName).toBe('HEADER')
    expect(styleOf(bar, 'background-color')).toBe('#1976d2')
    expect(styleOf(bar, 'color')).toBe('#fff')
    expect(getComputedStyle(bar).position).toBe('static')
    expect(styleOf(bar, 'box-shadow')).toBe(
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    )

    const title = screen.getByText("Robin's Photos")
    expect(title.tagName).toBe('DIV')
    expect(styleOf(title, 'font-size')).toBe('1.25rem')
    expect(getComputedStyle(title).flexGrow).toBe('1')
  })

  it('uses the MUI toolbar height and gutters', async () => {
    renderWithRouter(<Header />)
    const toolbar = (await screen.findByRole('link', { name: 'Home' }))
      .parentElement as HTMLElement
    expect(getComputedStyle(toolbar).display).toBe('flex')
    expect(getComputedStyle(toolbar).minHeight).toBe('56px')
    expect(styleOf(toolbar, 'padding-left')).toBe('16px')
  })
})
