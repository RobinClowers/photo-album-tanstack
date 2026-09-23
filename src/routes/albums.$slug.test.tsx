// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './albums.$slug'

vi.mock('@/api/albums', () => ({ getAlbumDetails: vi.fn() }))

const ALBUM = {
  title: 'Iceland',
  slug: 'iceland',
  photos: [
    {
      id: 1,
      filename: 'falls.jpg',
      caption: 'Waterfall',
      aspectRatio: 1.5,
      src: '/falls.jpg',
      srcSet: undefined,
    },
  ],
}

describe('/albums/$slug', () => {
  it('renders the album title and its photo grid', async () => {
    renderRoute(Route, {
      id: '/albums/$slug',
      path: '/albums/$slug',
      url: '/albums/iceland',
      loaderData: { album: ALBUM },
    })
    const title = await screen.findByRole('heading', { level: 1 })
    expect(title.textContent).toBe('Iceland')
    expect(styleOf(title, 'font-size')).toBe('3rem')
    expect(getComputedStyle(title).textAlign).toBe('center')
    // MUI gutterBottom; main's `sx={{ mb: 4 }}` never applied under Pigment.
    expect(styleOf(title, 'margin-bottom')).toBe('0.35em')
    expect(
      screen.getByRole('link', { name: /Waterfall/ }).getAttribute('href'),
    ).toBe('/albums/iceland/falls.jpg')
    const page = title.parentElement as HTMLElement
    expect(getComputedStyle(page).maxWidth).toBe('1536px')
    expect(styleOf(page, 'padding-top')).toBe('32px')
  })
})
