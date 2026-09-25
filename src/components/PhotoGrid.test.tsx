// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, varName } from '@/components/ui/test-utils'
import type { GridPhoto } from '@/utils/publicPhoto'
import PhotoGrid from './PhotoGrid'
import { photoGrid } from './photoGrid.stylex'

const photo = (id: number, aspectRatio = 1.5): GridPhoto => ({
  id,
  filename: `p${id}.jpg`,
  caption: null,
  aspectRatio,
  src: `/p${id}.jpg`,
  srcSet: undefined,
})

describe('PhotoGrid', () => {
  it('lays tiles out in wrapping flex rows', async () => {
    renderWithRouter(
      <PhotoGrid photos={[photo(1), photo(2, 0.75)]} albumSlug="trip" />,
    )
    const links = await screen.findAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/albums/trip/p1.jpg',
      '/albums/trip/p2.jpg',
    ])
    const grid = links[0]?.parentElement?.parentElement as HTMLElement
    const style = getComputedStyle(grid)
    expect(style.display).toBe('flex')
    expect(style.flexWrap).toBe('wrap')
    expect(style.alignItems).toBe('flex-start')
    expect(style.gap).toBe('10px')
    // jsdom has no viewport width, so only the default (phone) value applies.
    expect(style.paddingLeft).toBe('0px')
  })

  it('loads the first 12 photos eagerly and the rest lazily', async () => {
    const photos = Array.from({ length: 14 }, (_, i) => photo(i + 1))
    renderWithRouter(<PhotoGrid photos={photos} albumSlug="trip" />)
    const images = await screen.findAllByRole('presentation')
    expect(images).toHaveLength(14)
    expect(images.map((img) => img.getAttribute('loading'))).toEqual([
      ...Array(12).fill('eager'),
      'lazy',
      'lazy',
    ])
    expect(images[11]?.getAttribute('fetchpriority')).toBe('high')
    expect(images[12]?.getAttribute('fetchpriority')).toBe('auto')
  })

  it('targets 320px rows, or 200px below the sm breakpoint', async () => {
    renderWithRouter(<PhotoGrid photos={[photo(1)]} albumSlug="trip" />)
    await screen.findByRole('link')
    const name = varName(photoGrid.rowHeight)
    const rules = (globalThis as { __rawCssRules?: string[] }).__rawCssRules
    const definitions = (rules ?? [])
      .filter((rule) => rule.includes(`${name}:`))
      .map((rule) => rule.replace(/\.x\w+/, '.hash'))
    expect(definitions).toEqual([
      `:root, .hash{${name}:320px;}`,
      `@media (max-width: 599.95px){:root, .hash{${name}:200px;}}`,
    ])
  })
})
