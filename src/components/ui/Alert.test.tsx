// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'
import { Button } from './Button'
import { styleOf } from './test-utils'

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
})
