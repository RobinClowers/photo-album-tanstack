// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { importRow } from '@/test/adminFixtures'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './admin.imports.index'

vi.mock('@/api/admin-imports', () => ({ adminListImports: vi.fn() }))

const renderImports = (imports: unknown[]) =>
  renderRoute(Route, {
    id: '/admin/imports/',
    path: '/admin/imports',
    url: '/admin/imports',
    loaderData: { imports },
  })

describe('/admin/imports', () => {
  it('explains how to start an import when there are none', async () => {
    renderImports([])
    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Imports',
    })
    expect(styleOf(heading, 'margin-bottom')).toBe('0.35em')
    const empty = screen.getByText(/^No imports yet/)
    expect(styleOf(empty, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    expect(screen.queryByRole('table')).toBeNull()
    const page = heading.parentElement as HTMLElement
    expect(styleOf(page, 'padding-top')).toBe('32px')
    expect(getComputedStyle(page).maxWidth).toBe('1200px')
  })

  it('lists imports with links to the import and its album', async () => {
    renderImports([
      importRow(),
      importRow({ id: 6, album: null, kind: 'google', status: 'running' }),
    ])
    const started = await screen.findAllByRole('link', {
      name: '2024-06-02 08:30',
    })
    expect(started.map((a) => a.getAttribute('href'))).toEqual([
      '/admin/imports/5',
      '/admin/imports/6',
    ])
    expect(
      styleOf(started[0]?.parentElement as HTMLElement, 'white-space'),
    ).toBe('nowrap')
    expect(
      screen.getByRole('link', { name: 'Iceland' }).getAttribute('href'),
    ).toBe('/admin/albums/7')
    expect(
      screen.getAllByRole('columnheader').map((th) => th.textContent),
    ).toEqual(['Started', 'Kind', 'Album', 'Status', 'Progress'])
    const secondRow = screen.getAllByRole('row')[2] as HTMLElement
    expect(
      [...secondRow.querySelectorAll('td')]
        .slice(1, 4)
        .map((td) => td.textContent),
    ).toEqual(['Google Photos import', '—', 'running'])
  })
})
