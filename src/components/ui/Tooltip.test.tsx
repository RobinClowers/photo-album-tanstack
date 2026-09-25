// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarIcon } from './Icon'
import { IconButton } from './IconButton'
import { Tooltip } from './Tooltip'
import { styleOf } from './test-utils'

describe('Tooltip', () => {
  it('shows its title when the trigger is focused', async () => {
    render(
      <Tooltip title="Use as cover">
        <IconButton aria-label="Use as cover">
          <StarIcon />
        </IconButton>
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'Use as cover' })
    expect(screen.queryByText('Use as cover', { selector: 'div' })).toBeNull()
    act(() => button.focus())
    const tip = await screen.findByText('Use as cover', { selector: 'div' })
    expect(styleOf(tip, 'font-size')).toBe('0.6875rem')
    expect(styleOf(tip, 'padding')).toBe('4px 8px')
  })

  it('opens on hover after the delay and closes on leave', async () => {
    vi.useFakeTimers()
    try {
      render(
        <Tooltip title="Delete photo" delay={100}>
          <IconButton aria-label="Delete photo">
            <StarIcon />
          </IconButton>
        </Tooltip>,
      )
      const button = screen.getByRole('button', { name: 'Delete photo' })
      fireEvent.pointerEnter(button, { pointerType: 'mouse' })
      fireEvent.mouseEnter(button)
      fireEvent.mouseMove(button)
      await act(async () => {
        vi.advanceTimersByTime(150)
      })
      expect(screen.getByText('Delete photo', { selector: 'div' })).toBeTruthy()
      fireEvent.pointerLeave(button, { pointerType: 'mouse' })
      fireEvent.mouseLeave(button)
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.queryByText('Delete photo', { selector: 'div' })).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
