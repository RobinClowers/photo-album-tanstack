// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from './Table'
import { styleOf } from './test-utils'

function Albums({ size }: { size?: 'small' | 'medium' }) {
  return (
    <TableContainer>
      <Table size={size} aria-label="Albums">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>Title</TableCell>
            <TableCell align="right">Photos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow hover>
            <TableCell padding="checkbox">img</TableCell>
            <TableCell>Summer</TableCell>
            <TableCell align="right">12</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

describe('Table', () => {
  it('renders semantic table markup with column headers', () => {
    render(<Albums />)
    const table = screen.getByRole('table', { name: 'Albums' })
    const headers = within(table).getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['', 'Title', 'Photos'])
    expect(headers[1]?.getAttribute('scope')).toBe('col')
    expect(within(table).getByRole('cell', { name: 'Summer' }).tagName).toBe(
      'TD',
    )
    expect(styleOf(table, 'border-collapse')).toBe('collapse')
  })

  it('styles head and body cells like MUI', () => {
    render(<Albums />)
    const head = screen.getByRole('columnheader', { name: 'Title' })
    expect(styleOf(head, 'font-weight')).toBe('500')
    expect(styleOf(head, 'line-height')).toBe('1.5rem')
    expect(styleOf(head, 'padding')).toBe('16px')
    const cell = screen.getByRole('cell', { name: 'Summer' })
    expect(styleOf(cell, 'font-weight')).toBe('400')
    expect(styleOf(cell, 'border-bottom-width')).toBe('1px')
    expect(styleOf(cell, 'border-bottom-color')).toBe('#e0e0e0')
    expect(
      styleOf(screen.getByRole('cell', { name: '12' }), 'text-align'),
    ).toBe('right')
    expect(styleOf(screen.getByRole('cell', { name: 'img' }), 'width')).toBe(
      '48px',
    )
  })

  it('can draw the container as an outlined paper', () => {
    render(
      <TableContainer paper="outlined" data-testid="container">
        <Table />
      </TableContainer>,
    )
    const container = screen.getByTestId('container')
    expect(styleOf(container, 'border-top-width')).toBe('1px')
    expect(styleOf(container, 'border-radius')).toBe('4px')
    expect(styleOf(container, 'overflow-x')).toBe('auto')
  })

  it('uses dense padding when small', () => {
    render(<Albums size="small" />)
    expect(
      styleOf(screen.getByRole('cell', { name: 'Summer' }), 'padding'),
    ).toBe('6px 16px')
  })
})
