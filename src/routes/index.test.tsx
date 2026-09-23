// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './index'

vi.mock('@/api/albums', () => ({ getAllAlbums: vi.fn() }))

const ALBUMS = [
  {
    id: 1,
    slug: 'iceland',
    title: 'Iceland',
    cover_photo: {
      src: '/photos/iceland-sm.jpg',
      srcSet: '/photos/iceland-sm.jpg 400w',
    },
  },
  { id: 2, slug: 'empty', title: 'Empty album', cover_photo: null },
]

describe('/', () => {
  it('links each album card to its album page', async () => {
    renderRoute(Route, {
      id: '/',
      path: '/',
      url: '/',
      loaderData: { albums: ALBUMS },
    })
    const iceland = await screen.findByRole('link', { name: /Iceland/ })
    expect(iceland.getAttribute('href')).toBe('/albums/iceland')
    expect(getComputedStyle(iceland).textDecoration).toBe('none')
    expect(
      screen.getByRole('link', { name: 'Empty album' }).getAttribute('href'),
    ).toBe('/albums/empty')
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Iceland', 'Empty album'])
  })

  it('renders a 240x180 cover image when the album has one', async () => {
    renderRoute(Route, {
      id: '/',
      path: '/',
      url: '/',
      loaderData: { albums: ALBUMS },
    })
    const cover = await screen.findByRole('img', { name: 'Iceland' })
    expect(cover.getAttribute('src')).toBe('/photos/iceland-sm.jpg')
    expect(cover.getAttribute('srcset')).toBe('/photos/iceland-sm.jpg 400w')
    expect(cover.getAttribute('sizes')).toBe('240px')
    expect(cover.getAttribute('width')).toBe('240')
    expect(cover.getAttribute('height')).toBe('180')
    expect(getComputedStyle(cover).objectFit).toBe('cover')
    expect(
      screen.getByRole('link', { name: 'Empty album' }).querySelector('img'),
    ).toBeNull()
  })

  it('centers a fixed-width grid of cards', async () => {
    renderRoute(Route, {
      id: '/',
      path: '/',
      url: '/',
      loaderData: { albums: ALBUMS },
    })
    const title = await screen.findByRole('heading', { name: 'Iceland' })
    expect(getComputedStyle(title).textAlign).toBe('center')
    // Plain h6 (weight 500, no margins): main's `sx={{ my: 1, fontWeight:
    // 400 }}` and the card hover lift never applied under Pigment.
    expect(styleOf(title, 'font-weight')).toBe('500')
    expect(styleOf(title, 'margin-top')).toBe('0px')
    expect(styleOf(title, 'margin-bottom')).toBe('0px')
    const card = title.parentElement as HTMLElement
    expect(styleOf(card, 'box-shadow')).toBe(
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    )
    expect(getComputedStyle(card).transitionProperty).toBe('box-shadow')
    expect(getComputedStyle(card).transform).toBe('')
    const grid = card.parentElement?.parentElement as HTMLElement
    expect(getComputedStyle(grid).display).toBe('grid')
    expect(getComputedStyle(grid).gridTemplateColumns).toBe(
      // StyleX minifies the value.
      'repeat(auto-fit,240px)',
    )
    expect(styleOf(grid, 'gap')).toBe('24px')
  })
})
