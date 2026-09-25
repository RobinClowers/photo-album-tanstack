// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  declaredStyle,
  renderWithRouter,
  styleOf,
} from '@/components/ui/test-utils'
import { albumRow } from '@/test/adminFixtures'
import { AlbumTable } from './AlbumTable'

describe('AlbumTable', () => {
  it('shows a padded "None." for an empty list', () => {
    render(
      <AlbumTable albums={[]} onTogglePublished={vi.fn()} pending={false} />,
    )
    const empty = screen.getByText('None.')
    expect(empty.tagName).toBe('P')
    expect(declaredStyle(empty, 'padding')).toBe('16px')
    expect(styleOf(empty, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('lists albums with a thumbnail, admin link, slug and first photo date', async () => {
    renderWithRouter(
      <AlbumTable
        albums={[albumRow()]}
        onTogglePublished={vi.fn()}
        pending={false}
      />,
    )
    const link = await screen.findByRole('link', { name: 'Iceland' })
    expect(link.getAttribute('href')).toBe('/admin/albums/7')
    expect(styleOf(link, 'font-weight')).toBe('500')
    expect(
      screen.getAllByRole('columnheader').map((th) => th.textContent),
    ).toEqual(['', 'Title', 'Slug', 'Photos', 'First photo', ''])
    const cells = screen.getAllByRole('cell')
    expect(cells.map((td) => td.textContent)).toEqual([
      '',
      'Iceland',
      'iceland',
      '12',
      '2024-06-01',
      'Publish',
    ])
    expect(styleOf(screen.getByText('iceland'), 'color')).toBe(
      'rgba(0, 0, 0, 0.6)',
    )
    const thumbnail = cells[0]?.querySelector('img') as HTMLImageElement
    expect(thumbnail.getAttribute('src')).toMatch(
      /iceland\/mobile_sm\/falls\.jpg$/,
    )
    expect(styleOf(cells[5] as HTMLElement, 'white-space')).toBe('nowrap')
    // Unpublished: no public link.
    expect(screen.queryByRole('link', { name: 'View public page' })).toBeNull()
  })

  it('publishes and unpublishes through the callback', async () => {
    const onTogglePublished = vi.fn()
    const draft = albumRow()
    const live = albumRow({
      id: 8,
      slug: 'oslo',
      title: 'Oslo',
      publishedAt: '2024-01-01',
    })
    renderWithRouter(
      <AlbumTable
        albums={[draft, live]}
        onTogglePublished={onTogglePublished}
        pending={false}
      />,
    )
    const publish = await screen.findByRole('button', { name: 'Publish' })
    expect(styleOf(publish, 'margin-left')).toBe('8px')
    fireEvent.click(publish)
    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }))
    expect(onTogglePublished.mock.calls).toEqual([[draft], [live]])
    const view = screen.getByRole('link', { name: 'View public page' })
    expect(view.getAttribute('href')).toBe('/albums/oslo')
    expect(view.getAttribute('target')).toBe('_blank')
    expect(view.getAttribute('rel')).toBe('noreferrer')
  })

  it('cannot publish an album without a cover photo, or while pending', async () => {
    const { unmount } = renderWithRouter(
      <AlbumTable
        albums={[albumRow({ coverPhotoId: null })]}
        onTogglePublished={vi.fn()}
        pending={false}
      />,
    )
    const publish = await screen.findByRole('button', { name: 'Publish' })
    expect(publish.hasAttribute('disabled')).toBe(true)
    expect(publish.getAttribute('title')).toBe(
      'Choose a cover photo before publishing',
    )
    unmount()
    renderWithRouter(
      <AlbumTable
        albums={[albumRow({ publishedAt: '2024-01-01' })]}
        onTogglePublished={vi.fn()}
        pending
      />,
    )
    const unpublish = await screen.findByRole('button', { name: 'Unpublish' })
    expect(unpublish.hasAttribute('disabled')).toBe(true)
    expect(unpublish.getAttribute('title')).toBeNull()
  })
})
