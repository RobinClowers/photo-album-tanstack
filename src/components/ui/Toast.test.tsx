// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { AlertSeverity } from './Alert'
import { Button } from './Button'
import { Toast, ToastProvider, useToast } from './Toast'
import { declaredStyle, styleOf } from './test-utils'

function Imperative({
  timeout,
  severity = 'success',
  message = 'Album saved',
}: {
  timeout?: number
  severity?: AlertSeverity
  message?: string
}) {
  const toast = useToast()
  return (
    <Button onClick={() => toast.show({ message, severity, timeout })}>
      Save
    </Button>
  )
}

function Declarative({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button onClick={() => setError('Upload failed')}>Fail</Button>
      <Button onClick={() => setError(null)}>Clear</Button>
      <Toast
        open={Boolean(error)}
        severity="error"
        onClose={() => {
          setError(null)
          onClose()
        }}
      >
        {error}
      </Toast>
    </>
  )
}

describe('Toast', () => {
  it('shows an imperative toast in the notifications region', async () => {
    render(
      <ToastProvider>
        <Imperative />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const message = await screen.findByText('Album saved')
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy()
    const toast = message.parentElement?.parentElement as HTMLElement
    expect(styleOf(toast, 'padding')).toBe('6px 16px')
    expect(toast.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'SuccessOutlined',
    )
    // Same standard-Alert colors as Alert (MUI mixes from palette light).
    expect(declaredStyle(toast, 'background-color')).toBe(
      'color-mix(in srgb,#4caf50 10%,white)',
    )
    expect(declaredStyle(toast, 'color')).toBe(
      'color-mix(in srgb,#4caf50 40%,black)',
    )
  })

  it('announces success toasts politely as a dialog', async () => {
    render(
      <ToastProvider>
        <Imperative />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Album saved')
    expect(screen.getByRole('dialog', { hidden: true })).toBeTruthy()
    expect(screen.queryByRole('alertdialog', { hidden: true })).toBeNull()
    expect(screen.queryByRole('alert', { hidden: true })).toBeNull()
  })

  it('announces imperative error and warning toasts as alerts', async () => {
    render(
      <ToastProvider>
        <Imperative severity="warning" message="Quota low" />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findAllByText('Quota low')
    expect(screen.getByRole('alertdialog', { hidden: true })).toBeTruthy()
    const alert = screen.getByRole('alert', { hidden: true })
    expect(alert.textContent).toContain('Quota low')
  })

  it('auto-dismisses after the timeout', async () => {
    vi.useFakeTimers()
    try {
      render(
        <ToastProvider>
          <Imperative timeout={1000} />
        </ToastProvider>,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(screen.getByText('Album saved')).toBeTruthy()
      await act(async () => {
        vi.advanceTimersByTime(1500)
      })
      await act(async () => {
        vi.runAllTimers()
      })
      expect(screen.queryByText('Album saved')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('follows `open` declaratively and reports user dismissal', async () => {
    const onClose = vi.fn()
    render(
      <ToastProvider>
        <Declarative onClose={onClose} />
      </ToastProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }))
    expect(await screen.findAllByText('Upload failed')).not.toHaveLength(0)
    // Errors are high priority: an alertdialog with a role="alert" mirror.
    const toast = screen.getByRole('alertdialog', { hidden: true })
    expect(declaredStyle(toast, 'color')).toBe(
      'color-mix(in srgb,#ef5350 40%,black)',
    )
    expect(screen.getByRole('alert', { hidden: true }).textContent).toContain(
      'Upload failed',
    )

    // Parent clears the state: toast goes away without calling onClose.
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await waitFor(() =>
      expect(screen.queryAllByText('Upload failed')).toHaveLength(0),
    )
    expect(onClose).not.toHaveBeenCalled()

    // The close button dismisses it and calls onClose. Base UI hides it
    // from the accessibility tree (toasts are reached with F6 instead).
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }))
    await screen.findAllByText('Upload failed')
    fireEvent.click(screen.getByTitle('Close'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.queryAllByText('Upload failed')).toHaveLength(0),
    )
  })
})
