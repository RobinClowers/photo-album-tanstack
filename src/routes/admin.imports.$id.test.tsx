// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminRetryImport } from '@/api/admin-imports'
import { ToastProvider } from '@/components/ui'
import { declaredStyle, styleOf } from '@/components/ui/test-utils'
import { importDetails } from '@/test/adminFixtures'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './admin.imports.$id'

vi.mock('@/api/admin-imports', () => ({
  adminGetImport: vi.fn(),
  adminRetryImport: vi.fn(),
}))

const retry = vi.mocked(adminRetryImport)

const renderImport = (record = importDetails()) =>
  renderRoute(Route, {
    id: '/admin/imports/$id',
    path: '/admin/imports/$id',
    url: '/admin/imports/5',
    loaderData: { record },
    wrapper: ToastProvider,
  })

describe('/admin/imports/$id', () => {
  it('summarises the import and lists its items', async () => {
    renderImport()
    const title = await screen.findByRole('heading', { level: 1 })
    expect(title.textContent).toBe('Reprocess variants · Iceland')
    expect(
      screen.getByRole('link', { name: 'Iceland' }).getAttribute('href'),
    ).toBe('/admin/albums/7')
    const started = screen.getByText(
      'Started 2024-06-02 08:30, finished 2024-06-02 08:35',
    )
    expect(styleOf(started, 'color')).not.toBe('rgba(0, 0, 0, 0.6)')
    expect(screen.getByRole('alert').textContent).toBe('Queue send failed')
    const back = screen.getByRole('link', { name: 'All imports' })
    expect(back.getAttribute('href')).toBe('/admin/imports')
    expect(back.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'ArrowBack',
    )
    const rows = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => [...row.querySelectorAll('td')].map((td) => td.textContent))
    expect(rows).toEqual([
      ['b.jpg', 'failed', '3', 'Error: fetch failed', '2024-06-02 08:35'],
      ['a.jpg', 'done', '1', '', '2024-06-02 08:31'],
    ])
  })

  // Main's `sx` on this route's Paper, Alert and cells never applied under
  // Pigment; the page keeps that live look.
  it('matches the live layout of the MUI build', async () => {
    renderImport()
    await screen.findByRole('heading', { level: 1 })
    const alert = screen.getByRole('alert')
    const summary = alert.parentElement as HTMLElement
    expect(styleOf(summary, 'border-top-width')).toBe('1px')
    expect(declaredStyle(summary, 'padding')).toBe('')
    expect(styleOf(alert, 'margin-top')).toBe('')
    const error = screen.getByText('Error: fetch failed')
    expect(styleOf(error, 'font-family')).not.toBe('monospace')
    expect(styleOf(error, 'font-size')).toBe('0.875rem')
    expect(styleOf(error, 'color')).not.toBe('#d32f2f')
    const updated = screen.getByText('2024-06-02 08:35', { selector: 'td' })
    expect(styleOf(updated, 'white-space')).toBe('')
  })

  it('retries failed items', async () => {
    retry.mockResolvedValue({ retried: 1 } as Awaited<
      ReturnType<typeof adminRetryImport>
    >)
    renderImport()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry 1 failed' }),
    )
    await waitFor(() => expect(retry).toHaveBeenCalledWith({ data: { id: 5 } }))
  })

  it('shows a failed retry as an error toast', async () => {
    retry.mockImplementation(async () => {
      throw new Error('Nothing to retry')
    })
    renderImport()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry 1 failed' }),
    )
    const message = await screen.findByText('Nothing to retry', {
      selector: 'p',
    })
    expect(message.closest('[role="alertdialog"]')).not.toBeNull()
  })

  it('has no retry button without failures', async () => {
    renderImport(
      importDetails({
        status: 'done',
        error: null,
        counts: { total: 1, queued: 0, processing: 0, done: 1, failed: 0 },
      }),
    )
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
