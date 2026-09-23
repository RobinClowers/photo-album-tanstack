// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from './Dialog'
import { styleOf } from './test-utils'

function Example({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
    onClose?.()
  }
  return (
    <>
      <Button onClick={() => setOpen(true)}>Import</Button>
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>Import from Google Photos</DialogTitle>
        <DialogContent data-testid="content">
          <DialogContentText>Pick the photos to add.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('opens a labelled, described modal dialog', async () => {
    render(<Example />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'Import from Google Photos',
    })
    expect(dialog.getAttribute('aria-describedby')).toBe(
      screen.getByText('Pick the photos to add.').id,
    )
    expect(styleOf(dialog, 'max-width')).toBe('600px')
    expect(styleOf(dialog, 'width')).toBe('calc(100% - 64px)')
    expect(
      screen.getByRole('heading', {
        name: 'Import from Google Photos',
        level: 2,
      }),
    ).toBeTruthy()
  })

  it('drops the content top padding after a title, as MUI does', async () => {
    render(<Example />)
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    const content = await screen.findByTestId('content')
    expect(styleOf(content, 'padding-top')).toBe('0px')
  })

  it('closes on Escape and from an action button', async () => {
    const onClose = vi.fn()
    render(<Example onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'Escape' })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Import' }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
