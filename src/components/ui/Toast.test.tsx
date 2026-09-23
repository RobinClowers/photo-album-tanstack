// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Toast, ToastProvider, useToast } from './Toast'
import { styleOf } from './test-utils'

function Imperative({ timeout }: { timeout?: number }) {
  const toast = useToast()
  return (
    <Button
      onClick={() =>
        toast.show({ message: 'Album saved', severity: 'success', timeout })
      }
    >
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
    expect(await screen.findByText('Upload failed')).toBeTruthy()

    // Parent clears the state: toast goes away without calling onClose.
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(screen.queryByText('Upload failed')).toBeNull())
    expect(onClose).not.toHaveBeenCalled()

    // The close button dismisses it and calls onClose. Base UI hides it
    // from the accessibility tree (toasts are reached with F6 instead).
    fireEvent.click(screen.getByRole('button', { name: 'Fail' }))
    await screen.findByText('Upload failed')
    fireEvent.click(screen.getByTitle('Close'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByText('Upload failed')).toBeNull())
  })
})
