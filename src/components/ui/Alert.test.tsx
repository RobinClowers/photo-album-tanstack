// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'
import { Button } from './Button'
import { declaredStyle, styleOf } from './test-utils'

describe('Alert', () => {
  it('is an alert region with the severity icon', () => {
    render(<Alert severity="error">Something failed</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('Something failed')
    expect(alert.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'ErrorOutline',
    )
    expect(styleOf(alert, 'padding')).toBe('6px 16px')
    expect(styleOf(alert, 'display')).toBe('flex')
  })

  it('uses a different icon per severity', () => {
    render(
      <>
        <Alert severity="success">s</Alert>
        <Alert severity="info">i</Alert>
        <Alert severity="warning">w</Alert>
      </>,
    )
    const icons = screen
      .getAllByRole('alert')
      .map((a) => a.querySelector('svg')?.getAttribute('data-icon'))
    expect(icons).toEqual([
      'SuccessOutlined',
      'InfoOutlined',
      'ReportProblemOutlined',
    ])
  })

  it('hides the icon with icon={false}', () => {
    render(<Alert icon={false}>Plain</Alert>)
    expect(screen.getByRole('alert').querySelector('svg')).toBeNull()
  })

  it('renders a close button when onClose is given', () => {
    const onClose = vi.fn()
    render(<Alert onClose={onClose}>Dismiss me</Alert>)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a custom action instead of the close button', () => {
    render(
      <Alert onClose={() => {}} action={<Button size="small">Undo</Button>}>
        Deleted
      </Alert>,
    )
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('mixes the standard colors from the palette light shade, like MUI', () => {
    // MUI: background lighten(light, 0.9), text darken(light, 0.6), e.g.
    // success #edf7ed / #1e4620 and error #fdeded / #5f2120.
    render(
      <>
        <Alert severity="success">s</Alert>
        <Alert severity="info">i</Alert>
        <Alert severity="warning">w</Alert>
        <Alert severity="error">e</Alert>
      </>,
    )
    const [success, info, warning, error] = screen.getAllByRole('alert')
    expect(declaredStyle(success as Element, 'background-color')).toBe(
      'color-mix(in srgb,#4caf50 10%,white)',
    )
    expect(declaredStyle(success as Element, 'color')).toBe(
      'color-mix(in srgb,#4caf50 40%,black)',
    )
    expect(declaredStyle(info as Element, 'color')).toBe(
      'color-mix(in srgb,#03a9f4 40%,black)',
    )
    expect(declaredStyle(warning as Element, 'color')).toBe(
      'color-mix(in srgb,#ff9800 40%,black)',
    )
    expect(declaredStyle(error as Element, 'background-color')).toBe(
      'color-mix(in srgb,#ef5350 10%,white)',
    )
    expect(declaredStyle(error as Element, 'color')).toBe(
      'color-mix(in srgb,#ef5350 40%,black)',
    )
    // The icon keeps the main shade.
    const icon = (error as Element).querySelector('svg')?.parentElement
    expect(styleOf(icon as Element, 'color')).toBe('#d32f2f')
  })
})
