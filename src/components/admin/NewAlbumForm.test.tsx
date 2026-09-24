// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { adminCreateAlbum } from '@/api/admin-albums'
import {
  declaredStyle,
  renderWithRouter,
  styleOf,
} from '@/components/ui/test-utils'
import { NewAlbumForm } from './NewAlbumForm'

vi.mock('@/api/admin-albums', () => ({ adminCreateAlbum: vi.fn() }))

// Tests that submit set their own implementation. No mockReset/mockClear in a
// beforeEach: clearing this mock after a rejected call made vitest report the
// rejection as a failure of the following tests.
const createAlbum = vi.mocked(adminCreateAlbum)

describe('NewAlbumForm', () => {
  it('derives the slug from the title until the slug is edited', async () => {
    renderWithRouter(<NewAlbumForm />)
    const title = await screen.findByRole('textbox', { name: /Title/ })
    const slug = screen.getByRole('textbox', { name: /Slug/ })
    const create = screen.getByRole('button', { name: 'Create' })
    expect(create.hasAttribute('disabled')).toBe(true)
    fireEvent.change(title, { target: { value: 'Summer in Oslo' } })
    expect((slug as HTMLInputElement).value).toBe('summer-in-oslo')
    expect(create.hasAttribute('disabled')).toBe(false)
    fireEvent.change(slug, { target: { value: 'oslo' } })
    fireEvent.change(title, { target: { value: 'Oslo' } })
    expect((slug as HTMLInputElement).value).toBe('oslo')
  })

  it('flags an invalid slug and blocks submitting it', async () => {
    renderWithRouter(<NewAlbumForm />)
    fireEvent.change(await screen.findByRole('textbox', { name: /Title/ }), {
      target: { value: 'Oslo' },
    })
    const slug = screen.getByRole('textbox', { name: /Slug/ })
    fireEvent.change(slug, { target: { value: 'Not A Slug' } })
    expect(slug.getAttribute('aria-invalid')).toBe('true')
    expect(
      screen.getByText('Lowercase letters, numbers and dashes'),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Create' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('creates the album and opens it', async () => {
    createAlbum.mockResolvedValue({ id: 42 } as Awaited<
      ReturnType<typeof adminCreateAlbum>
    >)
    const { router } = renderWithRouter(<NewAlbumForm />)
    fireEvent.change(await screen.findByRole('textbox', { name: /Title/ }), {
      target: { value: ' Oslo ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/albums/42'),
    )
    expect(createAlbum).toHaveBeenCalledWith({
      data: { title: 'Oslo', slug: 'oslo' },
    })
  })

  it('shows the server error below the fields', async () => {
    createAlbum.mockImplementation(async () => {
      throw new Error('An album with slug "oslo" already exists')
    })
    renderWithRouter(<NewAlbumForm />)
    fireEvent.change(await screen.findByRole('textbox', { name: /Title/ }), {
      target: { value: 'Oslo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    const error = await screen.findByRole('alert')
    expect(error.textContent).toBe('An album with slug "oslo" already exists')
    expect(styleOf(error, 'color')).toBe('#d32f2f')
    expect(styleOf(error, 'font-size')).toBe('0.875rem')
  })

  it('lays out as a padded paper with flexible fields', async () => {
    renderWithRouter(<NewAlbumForm />)
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'New album',
    })
    const form = heading.parentElement as HTMLElement
    expect(form.tagName).toBe('FORM')
    expect(declaredStyle(form, 'padding')).toBe('16px')
    const create = screen.getByRole('button', { name: 'Create' })
    expect(styleOf(create, 'align-self')).toBe('flex-start')
    const field = create.previousElementSibling as HTMLElement
    expect(styleOf(field, 'flex')).toBe('1 1 240px')
  })
})
