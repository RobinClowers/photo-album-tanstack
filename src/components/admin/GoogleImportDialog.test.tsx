// @vitest-environment jsdom
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  adminCancelGooglePick,
  adminGoogleStatus,
  adminPollGooglePick,
  adminStartGooglePick,
} from '@/api/admin-google'
import { renderWithRouter, styleOf } from '@/components/ui/test-utils'
import { GoogleImportDialog } from './GoogleImportDialog'

vi.mock('@/api/admin-google', () => ({
  adminCancelGooglePick: vi.fn(),
  adminGoogleStatus: vi.fn(),
  adminPollGooglePick: vi.fn(),
  adminStartGooglePick: vi.fn(),
}))

type Status = Awaited<ReturnType<typeof adminGoogleStatus>>
type Start = Awaited<ReturnType<typeof adminStartGooglePick>>
type Poll = Awaited<ReturnType<typeof adminPollGooglePick>>

const status = vi.mocked(adminGoogleStatus)
const start = vi.mocked(adminStartGooglePick)
const poll = vi.mocked(adminPollGooglePick)
const cancel = vi.mocked(adminCancelGooglePick)

// Restores the window.open spies. The server-function mocks are set per
// test instead of reset (see NewAlbumForm.test.tsx).
afterEach(() => {
  vi.restoreAllMocks()
})

const SKIPPED = {
  existingById: 1,
  existingByFilename: 0,
  unsupported: 2,
  duplicateFilename: 1,
}

function renderDialog(onClose = vi.fn()) {
  const view = renderWithRouter(
    <GoogleImportDialog albumId={7} open onClose={onClose} />,
  )
  return { ...view, onClose }
}

describe('GoogleImportDialog', () => {
  it('asks to connect Google Photos when the account is not connected', async () => {
    status.mockResolvedValue({ status: 'disconnected' } as Status)
    const { onClose } = renderDialog()
    const dialog = await screen.findByRole('dialog', {
      name: 'Import from Google Photos',
    })
    const connect = await screen.findByRole('link', {
      name: 'Connect Google Photos',
    })
    expect(connect.getAttribute('href')).toBe(
      '/api/auth/google/photos?returnTo=%2Fadmin%2Falbums%2F7',
    )
    expect(dialog.textContent).toContain('Connect your Google account')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows a load error', async () => {
    status.mockImplementation(async () => {
      throw new Error('Google is down')
    })
    renderDialog()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Google is down')
  })

  it('opens the picker, polls, and reports what was queued', async () => {
    status.mockResolvedValue({
      status: 'connected',
      expiresAt: '2030-01-01T00:00:00.000Z',
    } as Status)
    start.mockResolvedValue({
      status: 'picking',
      importId: 9,
      pickerUri: 'https://photos.google.com/pick',
      pollIntervalMs: 10,
      expiresAt: null,
    } as Start)
    poll
      .mockResolvedValueOnce({ status: 'picking', pollIntervalMs: 10 } as Poll)
      .mockResolvedValue({
        status: 'running',
        queued: 3,
        skipped: SKIPPED,
      } as Poll)
    const tab = { close: vi.fn(), location: { href: '' } }
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
    renderDialog()
    const choose = await screen.findByRole('button', {
      name: 'Choose photos in Google Photos',
    })
    expect(choose.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'OpenInNew',
    )
    fireEvent.click(choose)
    expect(window.open).toHaveBeenCalledWith('', '_blank')
    const again = await screen.findByRole('link', { name: 'Open it again' })
    expect(again.getAttribute('href')).toBe('https://photos.google.com/pick')
    expect(tab.location.href).toBe('https://photos.google.com/pick')
    expect(screen.getByRole('button', { name: 'Cancel import' })).toBeTruthy()
    const queued = await screen.findByText('3 photos queued for import.')
    expect(poll).toHaveBeenCalledTimes(2)
    expect(poll).toHaveBeenLastCalledWith({ data: { importId: 9 } })
    expect(queued.closest('[role="alert"]')).not.toBeNull()
    const skipped = screen.getByText(
      'Skipped: 1 already in the album (same Google id), 2 not a supported photo, 1 duplicate filename.',
    )
    expect(styleOf(skipped, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    expect(
      screen.getByRole('link', { name: 'import page' }).getAttribute('href'),
    ).toBe('/admin/imports/9')
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy()
  })

  it('cancels a pick in progress when closed', async () => {
    status.mockResolvedValue({
      status: 'connected',
      expiresAt: '2030-01-01T00:00:00.000Z',
    } as Status)
    start.mockResolvedValue({
      status: 'picking',
      importId: 9,
      pickerUri: 'https://photos.google.com/pick',
      pollIntervalMs: 60_000,
      expiresAt: null,
    } as Start)
    cancel.mockResolvedValue({ status: 'cancelled' })
    vi.spyOn(window, 'open').mockReturnValue(null)
    poll.mockClear()
    const { onClose } = renderDialog()
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Choose photos in Google Photos',
      }),
    )
    const cancelButton = await screen.findByRole('button', {
      name: 'Cancel import',
    })
    await act(async () => {
      fireEvent.click(cancelButton)
    })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(cancel).toHaveBeenCalledWith({ data: { importId: 9 } })
    expect(poll).not.toHaveBeenCalled()
  })
})
