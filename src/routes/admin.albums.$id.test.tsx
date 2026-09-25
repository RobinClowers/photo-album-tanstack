// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  adminDeletePhoto,
  adminSetAlbumPublished,
  adminUpdateAlbum,
} from '@/api/admin-albums'
import { adminGoogleStatus } from '@/api/admin-google'
import { adminReprocessAlbum } from '@/api/admin-imports'
import { ToastProvider } from '@/components/ui'
import { declaredStyle, styleOf } from '@/components/ui/test-utils'
import { albumDetails, albumImport } from '@/test/adminFixtures'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './admin.albums.$id'

vi.mock('@/api/admin-albums', () => ({
  adminDeletePhoto: vi.fn(),
  adminGetAlbum: vi.fn(),
  adminSetAlbumPublished: vi.fn(),
  adminSetCoverPhoto: vi.fn(),
  adminUpdateAlbum: vi.fn(),
  adminUpdatePhotoCaption: vi.fn(),
}))
vi.mock('@/api/admin-imports', () => ({
  adminListAlbumImports: vi.fn(),
  adminReprocessAlbum: vi.fn(),
  adminReprocessPhoto: vi.fn(),
}))
vi.mock('@/api/admin-google', () => ({
  adminCancelGooglePick: vi.fn(),
  adminGoogleStatus: vi.fn(),
  adminPollGooglePick: vi.fn(),
  adminStartGooglePick: vi.fn(),
}))

const renderAlbum = (
  url = '/admin/albums/7',
  album = albumDetails(),
  imports = [albumImport()],
) =>
  renderRoute(Route, {
    id: '/admin/albums/$id',
    path: '/admin/albums/$id',
    url,
    loaderData: { album, imports },
    wrapper: ToastProvider,
  })

describe('/admin/albums/$id', () => {
  it('renders the toolbar, details form, photos and recent imports', async () => {
    renderAlbum()
    const back = await screen.findByRole('link', { name: 'All albums' })
    expect(back.getAttribute('href')).toBe('/admin')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Photos (2)' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Recent imports' }),
    ).toBeTruthy()
    expect(
      screen.getAllByRole('img').map((img) => img.getAttribute('alt')),
    ).toEqual(['falls.jpg', 'glacier.jpg'])
    // The first photo is the cover.
    expect(screen.getByRole('button', { name: 'Cover photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Use as cover' })).toBeTruthy()
    // Unpublished: no public link.
    expect(screen.queryByRole('link', { name: 'View public page' })).toBeNull()
    const grid = screen.getAllByRole('img')[0]?.parentElement
      ?.parentElement as HTMLElement
    expect(styleOf(grid, 'grid-template-columns')).toBe(
      'repeat(auto-fill,minmax(220px,1fr))',
    )
  })

  it('links a published album to its public page', async () => {
    renderAlbum(
      '/admin/albums/7',
      albumDetails({ publishedAt: '2024-01-01 00:00:00' }),
    )
    const view = await screen.findByRole('link', { name: 'View public page' })
    expect(view.getAttribute('href')).toBe('/albums/iceland')
    expect(view.getAttribute('target')).toBe('_blank')
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeTruthy()
  })

  it('publishes the album', async () => {
    const publish = vi.mocked(adminSetAlbumPublished)
    publish.mockResolvedValue({ id: 7 } as unknown as Awaited<
      ReturnType<typeof adminSetAlbumPublished>
    >)
    renderAlbum()
    fireEvent.click(await screen.findByRole('button', { name: 'Publish' }))
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith({
        data: { id: 7, published: true },
      }),
    )
  })

  it('reprocesses missing or every size from the menu', async () => {
    const reprocess = vi.mocked(adminReprocessAlbum)
    reprocess.mockResolvedValue({ id: 1 } as unknown as Awaited<
      ReturnType<typeof adminReprocessAlbum>
    >)
    renderAlbum()
    const trigger = await screen.findByRole('button', {
      name: 'Reprocess variants',
    })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    fireEvent.click(trigger)
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: 'Generate missing sizes only',
      }),
    )
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    fireEvent.click(trigger)
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Regenerate every size' }),
    )
    await waitFor(() => expect(reprocess).toHaveBeenCalledTimes(2))
    expect(reprocess.mock.calls).toEqual([
      [{ data: { albumId: 7, force: false } }],
      [{ data: { albumId: 7, force: true } }],
    ])
  })

  it('cannot reprocess an album without photos', async () => {
    renderAlbum('/admin/albums/7', albumDetails({ photos: [] }), [])
    const trigger = await screen.findByRole('button', {
      name: 'Reprocess variants',
    })
    expect(trigger.hasAttribute('disabled')).toBe(true)
    fireEvent.click(trigger)
    expect(screen.queryByRole('menu')).toBeNull()
    const empty = screen.getByText(/^No photos yet/)
    expect(styleOf(empty, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    expect(screen.queryByRole('heading', { name: 'Recent imports' })).toBeNull()
  })

  it('confirms before deleting a photo', async () => {
    const remove = vi.mocked(adminDeletePhoto)
    remove.mockResolvedValue({ deleted: 1 })
    renderAlbum()
    const [coverDelete] = await screen.findAllByRole('button', {
      name: 'Delete photo',
    })
    fireEvent.click(coverDelete as HTMLElement)
    const dialog = await screen.findByRole('dialog', { name: 'Delete photo?' })
    expect(dialog.textContent).toContain(
      'Permanently removes falls.jpg from this album',
    )
    expect(dialog.textContent).toContain(
      'The earliest remaining photo becomes the cover.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(remove).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Delete photo' })[1] as HTMLElement,
    )
    const second = await screen.findByRole('dialog', { name: 'Delete photo?' })
    expect(second.textContent).not.toContain('becomes the cover')
    const confirm = within(second).getByRole('button', { name: 'Delete' })
    expect(styleOf(confirm, 'background-color')).toBe('#d32f2f')
    fireEvent.click(confirm)
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith({ data: { photoId: 71 } }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('saves title and slug edits, showing failures as an error toast', async () => {
    const update = vi.mocked(adminUpdateAlbum)
    update.mockImplementation(async () => {
      throw new Error('An album with slug "oslo" already exists')
    })
    renderAlbum()
    const save = await screen.findByRole('button', { name: 'Save' })
    expect(save.hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByRole('textbox', { name: /Slug/ }), {
      target: { value: 'oslo' },
    })
    expect(save.hasAttribute('disabled')).toBe(false)
    fireEvent.click(save)
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        data: { id: 7, title: 'Iceland', slug: 'oslo' },
      }),
    )
    const message = await screen.findByText(
      'An album with slug "oslo" already exists',
      { selector: 'p' },
    )
    expect(message.closest('[role="alertdialog"]')).not.toBeNull()
  })

  // The styles main's `sx` asked for (they never applied under Pigment).
  it('pads the details form and sizes its fields', async () => {
    renderAlbum()
    const save = await screen.findByRole('button', { name: 'Save' })
    const form = save.closest('form') as HTMLElement
    expect(declaredStyle(form, 'padding')).toBe('16px')
    expect(styleOf(save, 'align-self')).toBe('flex-start')
    const slugField = save.previousElementSibling as HTMLElement
    expect(declaredStyle(slugField, 'flex')).toBe('1 1 240px')
    const titleField = slugField.previousElementSibling as HTMLElement
    expect(declaredStyle(titleField, 'flex')).toBe('2 1 240px')
    expect(
      screen.getByText(
        'Changing the slug changes the public URL and the storage path prefix for new uploads',
      ),
    ).toBeTruthy()
  })

  it('shows the Google Photos result from the OAuth callback', async () => {
    renderAlbum('/admin/albums/7?google=denied')
    const message = await screen.findByText(
      'Google Photos access was not granted.',
      { selector: 'p' },
    )
    // Warnings are announced assertively.
    expect(message.closest('[role="alertdialog"]')).not.toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('reopens the import dialog after connecting Google Photos', async () => {
    vi.mocked(adminGoogleStatus).mockResolvedValue({
      status: 'connected',
      expiresAt: '2030-01-01T00:00:00.000Z',
    } as Awaited<ReturnType<typeof adminGoogleStatus>>)
    renderAlbum('/admin/albums/7?google=connected')
    expect(
      await screen.findByRole('dialog', { name: 'Import from Google Photos' }),
    ).toBeTruthy()
    expect(
      await screen.findByRole('button', {
        name: 'Choose photos in Google Photos',
      }),
    ).toBeTruthy()
    expect(
      screen.getByText('Google Photos connected.', { selector: 'p' }),
    ).toBeTruthy()
  })
})
