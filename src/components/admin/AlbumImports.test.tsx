// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, styleOf } from '@/components/ui/test-utils'
import { albumImport, counts } from '@/test/adminFixtures'
import { AlbumImports } from './AlbumImports'

describe('AlbumImports', () => {
  it('lists each import with a link, kind, status and progress', async () => {
    renderWithRouter(
      <AlbumImports
        imports={[
          albumImport(),
          albumImport({
            id: 6,
            kind: 'google',
            status: 'running',
            createdAt: '2024-06-03T09:00:00.000Z',
            counts: counts({ total: 4, done: 1, processing: 1 }),
          }),
        ]}
      />,
    )
    const link = await screen.findByRole('link', { name: '2024-06-02 08:30' })
    expect(link.getAttribute('href')).toBe('/admin/imports/5')
    expect(styleOf(link.parentElement as HTMLElement, 'white-space')).toBe(
      'nowrap',
    )
    const rows = screen
      .getAllByRole('row')
      .map((row) =>
        [...row.querySelectorAll('td')].slice(0, 3).map((td) => td.textContent),
      )
    expect(rows).toEqual([
      ['2024-06-02 08:30', 'Reprocess variants', 'done'],
      ['2024-06-03 09:00', 'Google Photos import', 'running'],
    ])
    expect(screen.getByText('1 / 4 done, 1 running')).toBeTruthy()
    // Outlined paper: a divider border, no shadow.
    const container = screen.getByRole('table').parentElement as HTMLElement
    expect(styleOf(container, 'border-top-width')).toBe('1px')
    expect(styleOf(container, 'box-shadow')).toBe('')
  })
})
