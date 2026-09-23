// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Menu, MenuItem } from './Menu'
import { styleOf } from './test-utils'

function Example({
  onMissing,
  onAll,
}: {
  onMissing: () => void
  onAll: () => void
}) {
  return (
    <Menu trigger={<Button size="small">Reprocess variants</Button>}>
      <MenuItem onClick={onMissing}>Generate missing sizes only</MenuItem>
      <MenuItem onClick={onAll}>Regenerate every size</MenuItem>
      <MenuItem disabled>Unavailable</MenuItem>
    </Menu>
  )
}

describe('Menu', () => {
  it('opens from its trigger button and lists menu items', async () => {
    render(<Example onMissing={vi.fn()} onAll={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Reprocess variants' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    fireEvent.click(trigger)
    const menu = await screen.findByRole('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const items = screen.getAllByRole('menuitem')
    expect(items.map((i) => i.textContent)).toEqual([
      'Generate missing sizes only',
      'Regenerate every size',
      'Unavailable',
    ])
    expect(items[2]?.getAttribute('aria-disabled')).toBe('true')
    expect(styleOf(menu, 'padding')).toBe('8px 0px')
    expect(styleOf(items[0] as HTMLElement, 'padding')).toBe('6px 16px')
  })

  it('runs the chosen item and closes', async () => {
    const onAll = vi.fn()
    render(<Example onMissing={vi.fn()} onAll={onAll} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reprocess variants' }))
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Regenerate every size' }),
    )
    expect(onAll).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })

  it('supports keyboard selection', async () => {
    const onMissing = vi.fn()
    render(<Example onMissing={onMissing} onAll={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: 'Reprocess variants' })
    fireEvent.click(trigger)
    const item = await screen.findByRole('menuitem', {
      name: 'Generate missing sizes only',
    })
    fireEvent.keyDown(item, { key: 'Enter' })
    await waitFor(() => expect(onMissing).toHaveBeenCalledTimes(1))
  })

  it('closes on Escape', async () => {
    render(<Example onMissing={vi.fn()} onAll={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reprocess variants' }))
    const menu = await screen.findByRole('menu')
    fireEvent.keyDown(menu, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })
})
