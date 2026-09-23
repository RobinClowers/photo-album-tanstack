// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './albums.$slug_.$filename'

vi.mock('@/api/albums', () => ({ getPhotoDetailsFn: vi.fn() }))

const PHOTO = {
  caption: 'Waterfall',
  albumTitle: 'Iceland',
  src: '/falls-large.jpg',
  original: { src: '/falls.jpg', width: 3000, height: 2000 },
}

function renderPhoto(neighbours: {
  previousPhotoFilename?: string
  nextPhotoFilename?: string
}) {
  return renderRoute(Route, {
    id: '/albums/$slug_/$filename',
    path: '/albums/$slug/$filename',
    url: '/albums/iceland/falls.jpg',
    loaderData: { photo: PHOTO, ...neighbours },
  })
}

describe('/albums/$slug/$filename', () => {
  it('links back to the album and to the neighbouring photos', async () => {
    renderPhoto({ previousPhotoFilename: 'a.jpg', nextPhotoFilename: 'c.jpg' })
    const back = await screen.findByRole('link', { name: 'Back to album' })
    expect(back.getAttribute('href')).toBe('/albums/iceland')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Back to Iceland',
    )
    const previous = screen.getByRole('link', { name: 'Previous photo' })
    expect(previous.getAttribute('href')).toBe('/albums/iceland/a.jpg')
    expect(
      previous.querySelector('svg[data-icon="ArrowBackIosNew"]'),
    ).not.toBeNull()
    const next = screen.getByRole('link', { name: 'Next photo' })
    expect(next.getAttribute('href')).toBe('/albums/iceland/c.jpg')
    expect(
      next.querySelector('svg[data-icon="ArrowForwardIos"]'),
    ).not.toBeNull()
    // Large icon buttons, above the photo.
    expect(getComputedStyle(next).padding).toBe('12px')
    expect(getComputedStyle(next).zIndex).toBe('1')
    // No link nested inside another interactive element.
    expect(next.querySelector('button, a')).toBeNull()
  })

  it('shows the photo contained in the viewport with its caption', async () => {
    renderPhoto({})
    const img = await screen.findByRole('img', { name: 'Waterfall' })
    expect(img.getAttribute('src')).toBe('/falls-large.jpg')
    expect(getComputedStyle(img).objectFit).toBe('contain')
    expect(getComputedStyle(img).maxWidth).toBe('calc(100% - 120px)')
    expect(styleOf(img, 'border-radius')).toBe('4px')
    const stage = img.parentElement as HTMLElement
    expect(getComputedStyle(stage).justifyContent).toBe('space-between')
    expect(getComputedStyle(stage).height).toBe('calc(100vh - 150px)')
    const caption = screen.getByText('Waterfall', { selector: 'p' })
    expect(getComputedStyle(caption).textAlign).toBe('center')
  })

  it('keeps the photo centered with placeholders at the album ends', async () => {
    renderPhoto({})
    const img = await screen.findByRole('img', { name: 'Waterfall' })
    expect(screen.queryByRole('link', { name: 'Previous photo' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Next photo' })).toBeNull()
    const [before, , after] = Array.from(
      (img.parentElement as HTMLElement).children,
    )
    expect(getComputedStyle(before as Element).width).toBe('51px')
    expect(getComputedStyle(after as Element).width).toBe('51px')
  })
})
