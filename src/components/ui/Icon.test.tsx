// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import * as icons from './Icon'
import { HomeIcon, StarIcon } from './Icon'

describe('Icon', () => {
  it('renders a decorative 24x24 svg by default', () => {
    const { container } = render(<HomeIcon />)
    const svg = container.querySelector('svg') as SVGSVGElement
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('focusable')).toBe('false')
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(
      'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    )
    const style = getComputedStyle(svg)
    expect(style.width).toBe('1em')
    expect(style.height).toBe('1em')
    expect(style.fill).toBe('currentcolor')
  })

  it('exposes an accessible name with titleAccess', () => {
    render(<StarIcon titleAccess="Cover photo" />)
    const img = screen.getByRole('img', { name: 'Cover photo' })
    expect(img.hasAttribute('aria-hidden')).toBe(false)
  })

  it('supports inherit font size', () => {
    const { container } = render(<HomeIcon fontSize="inherit" />)
    expect(
      getComputedStyle(container.querySelector('svg') as Element).fontSize,
    ).toBe('inherit')
  })

  it('exports every icon the app uses', () => {
    expect(
      Object.keys(icons)
        .filter((k) => k.endsWith('Icon'))
        .sort(),
    ).toEqual([
      'ArrowBackIcon',
      'ArrowBackIosNewIcon',
      'ArrowDropDownIcon',
      'ArrowForwardIosIcon',
      'CloseIcon',
      'DeleteIcon',
      'ErrorOutlineIcon',
      'GoogleIcon',
      'HomeIcon',
      'InfoOutlinedIcon',
      'OpenInNewIcon',
      'PersonIcon',
      'RefreshIcon',
      'ReportProblemOutlinedIcon',
      'StarBorderIcon',
      'StarIcon',
      'SuccessOutlinedIcon',
    ])
  })
})
