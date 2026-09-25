// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminSetAlbumPublished } from '@/api/admin-albums'
import { ToastProvider } from '@/components/ui'
import { styleOf } from '@/components/ui/test-utils'
import { albumRow } from '@/test/adminFixtures'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './admin.index'

vi.mock('@/api/admin-albums', () => ({
  adminCreateAlbum: vi.fn(),
  adminListAlbums: vi.fn(),
  adminSetAlbumPublished: vi.fn(),
}))

const setPublished = vi.mocked(adminSetAlbumPublished)

const renderDashboard = () =>
  renderRoute(Route, {
    id: '/admin/',
    path: '/admin/',
    url: '/admin/',
    loaderData: {
      albums: [
        albumRow(),
        albumRow({
          id: 8,
          title: 'Oslo',
          slug: 'oslo',
          publishedAt: '2024-01-01 00:00:00',
        }),
      ],
    },
    wrapper: ToastProvider,
  })

describe('/admin', () => {
  it('splits albums into unpublished and published tables', async () => {
    renderDashboard()
    const unpublished = await screen.findByRole('heading', {
      level: 2,
      name: 'Unpublished (1)',
    })
    expect(styleOf(unpublished, 'font-size')).toBe('1.5rem')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Published (1)' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: 'New album' }),
    ).toBeTruthy()
    const [draft, live] = screen.getAllByRole('table')
    expect(draft?.textContent).toContain('Iceland')
    expect(live?.textContent).toContain('Oslo')
    const page = unpublished.closest('section')?.parentElement
      ?.parentElement as HTMLElement
    expect(styleOf(page, 'padding-top')).toBe('32px')
    expect(getComputedStyle(page).maxWidth).toBe('1200px')
  })

  it('toggles publishing and shows failures as an error toast', async () => {
    setPublished.mockImplementation(async () => {
      throw new Error('Album has no cover photo')
    })
    renderDashboard()
    fireEvent.click(await screen.findByRole('button', { name: 'Unpublish' }))
    const message = await screen.findByText('Album has no cover photo', {
      selector: 'p',
    })
    expect(setPublished).toHaveBeenCalledWith({
      data: { id: 8, published: false },
    })
    expect(message.closest('[role="alertdialog"]')).not.toBeNull()
    // Dismissed with its close button (it has no timeout).
    fireEvent.click(screen.getByTitle('Close'))
    await waitFor(() =>
      expect(screen.queryAllByText('Album has no cover photo')).toEqual([]),
    )
  })
})
