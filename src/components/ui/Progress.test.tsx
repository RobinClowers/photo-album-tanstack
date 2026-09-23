// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CircularProgress, LinearProgress } from './Progress'
import { styleOf } from './test-utils'

describe('LinearProgress', () => {
  it('exposes a determinate progressbar with its value', () => {
    render(<LinearProgress value={40} aria-label="Import progress" />)
    const bar = screen.getByRole('progressbar', { name: 'Import progress' })
    expect(bar.getAttribute('aria-valuenow')).toBe('40')
    expect(bar.getAttribute('aria-valuemin')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
    expect(styleOf(bar, 'height')).toBe('4px')
    const indicator = bar.querySelector('[style*="width"]') as HTMLElement
    expect(indicator.style.width).toBe('40%')
  })

  it('is indeterminate without a value', () => {
    render(<LinearProgress aria-label="Loading" color="error" />)
    const bar = screen.getByRole('progressbar', { name: 'Loading' })
    expect(bar.hasAttribute('aria-valuenow')).toBe(false)
    expect(bar.hasAttribute('data-indeterminate')).toBe(true)
    expect(bar.querySelectorAll('[data-bar]')).toHaveLength(2)
  })
})

describe('CircularProgress', () => {
  it('is an indeterminate 40px spinner by default', () => {
    render(<CircularProgress aria-label="Loading" />)
    const spinner = screen.getByRole('progressbar', { name: 'Loading' })
    expect(spinner.tagName).toBe('SPAN')
    expect(spinner.hasAttribute('aria-valuenow')).toBe(false)
    expect(spinner.getAttribute('style')).toContain('40px')
    expect(spinner.querySelector('circle')?.getAttribute('r')).toBe('20.2')
  })

  it('draws a determinate arc sized by the value', () => {
    render(<CircularProgress value={25} size={24} aria-label="Uploading" />)
    const spinner = screen.getByRole('progressbar', { name: 'Uploading' })
    expect(spinner.getAttribute('aria-valuenow')).toBe('25')
    expect(spinner.getAttribute('style')).toContain('24px')
    const circle = spinner.querySelector('circle') as SVGCircleElement
    expect(circle.getAttribute('stroke-dasharray')).toBe('126.920')
    expect(circle.getAttribute('stroke-dashoffset')).toBe('95.190px')
  })
})
