// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, styleOf } from '@/components/ui/test-utils'
import type { GridPhoto } from '@/utils/publicPhoto'
import PhotoGridItem from './PhotoGridItem'

const PHOTO: GridPhoto = {
  id: 7,
  filename: 'beach.jpg',
  caption: 'Sunset at the beach',
  aspectRatio: 1.5,
  src: '/photos/beach-tablet.jpg',
  srcSet: '/photos/beach-small.jpg 400w, /photos/beach-tablet.jpg 1024w',
}

describe('PhotoGridItem', () => {
  it('sizes the tile from the aspect ratio and the grid row height', async () => {
    renderWithRouter(<PhotoGridItem photo={PHOTO} albumSlug="trip" priority />)
    const link = await screen.findByRole('link')
    expect(link.getAttribute('href')).toBe('/albums/trip/beach.jpg')
    const tile = link.parentElement as HTMLElement
    expect(styleOf(tile, 'flex-grow')).toBe('1.5')
    expect(styleOf(tile, 'flex-basis')).toBe('calc(320px * 1.5)')
    expect(styleOf(tile, 'aspect-ratio')).toBe('1.5')
    expect(styleOf(tile, 'max-height')).toBe('calc(320px * 1.5)')
    expect(getComputedStyle(tile).overflow).toBe('hidden')
    expect(styleOf(tile, 'border-radius')).toBe('4px')
    expect(styleOf(tile, 'background-color')).toBe('#eeeeee')
  })

  it('hints srcset sizes for phone and desktop row heights', async () => {
    renderWithRouter(<PhotoGridItem photo={PHOTO} albumSlug="trip" priority />)
    const img = await screen.findByRole('img', { name: 'Sunset at the beach' })
    // 1.5 * 200 * 1.25 = 375, 1.5 * 320 * 1.25 = 600.
    expect(img.getAttribute('sizes')).toBe(
      '(max-width: 599px) min(100vw, 375px), 600px',
    )
    expect(img.getAttribute('srcset')).toBe(PHOTO.srcSet)
    expect(img.getAttribute('decoding')).toBe('async')
  })

  it('shows priority photos immediately', async () => {
    renderWithRouter(<PhotoGridItem photo={PHOTO} albumSlug="trip" priority />)
    const img = await screen.findByRole('img')
    expect(img.getAttribute('data-loaded')).toBe('true')
    expect(getComputedStyle(img).opacity).toBe('')
  })

  it('fades lazy photos in once they load', async () => {
    renderWithRouter(<PhotoGridItem photo={PHOTO} albumSlug="trip" />)
    const img = await screen.findByRole('img')
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('data-loaded')).toBe('false')
    expect(getComputedStyle(img).opacity).toBe('0')
    expect(getComputedStyle(img).transitionProperty).toBe('opacity')
    fireEvent.load(img)
    expect(img.getAttribute('data-loaded')).toBe('true')
    expect(getComputedStyle(img).opacity).toBe('')
  })

  it('overlays the caption on a single ellipsized line', async () => {
    renderWithRouter(<PhotoGridItem photo={PHOTO} albumSlug="trip" />)
    const caption = await screen.findByText('Sunset at the beach')
    expect(getComputedStyle(caption).whiteSpace).toBe('nowrap')
    const overlay = caption.parentElement as HTMLElement
    expect(getComputedStyle(overlay).position).toBe('absolute')
    expect(getComputedStyle(overlay).backgroundColor).toBe('rgba(0, 0, 0, 0.5)')
    expect(styleOf(overlay, 'color')).toBe('#fff')
  })

  it('omits the caption overlay and alt text for uncaptioned photos', async () => {
    renderWithRouter(
      <PhotoGridItem
        photo={{ ...PHOTO, caption: null }}
        albumSlug="trip"
        priority
      />,
    )
    const link = await screen.findByRole('link')
    expect(link.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(link.children).toHaveLength(1)
  })
})
