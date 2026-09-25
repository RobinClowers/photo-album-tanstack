// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { declaredStyle, styleOf } from '@/components/ui/test-utils'
import { photo } from '@/test/adminFixtures'
import { PhotoTile } from './PhotoTile'

function renderTile(props: Partial<Parameters<typeof PhotoTile>[0]> = {}) {
  const handlers = {
    onSaveCaption: vi.fn(() => Promise.resolve()),
    onSetCover: vi.fn(),
    onDelete: vi.fn(),
    onReprocess: vi.fn(),
  }
  const view = render(
    <PhotoTile
      photo={photo({ caption: 'Falls' })}
      isCover={false}
      disabled={false}
      {...handlers}
      {...props}
    />,
  )
  return { ...view, ...handlers }
}

describe('PhotoTile', () => {
  it('shows the thumbnail, filename and caption field', () => {
    renderTile()
    const img = screen.getByRole('img', { name: 'falls.jpg' })
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('src')).toMatch(/iceland\/mobile_sm\/falls\.jpg$/)
    expect(styleOf(img, 'aspect-ratio')).toBe('4 / 3')
    expect(styleOf(img, 'background-color')).toBe('#f5f5f5')
    const filename = screen.getByTitle('falls.jpg')
    expect(filename.textContent).toBe('falls.jpg')
    expect(styleOf(filename, 'font-size')).toBe('12px')
    expect(styleOf(filename, 'white-space')).toBe('nowrap')
    const caption = screen.getByRole('textbox', {
      name: 'Caption for falls.jpg',
    }) as HTMLTextAreaElement
    expect(caption.tagName).toBe('TEXTAREA')
    expect(caption.value).toBe('Falls')
    expect(caption.placeholder).toBe('Caption')
    expect(caption.maxLength).toBe(2000)
    // MUI scales the whole input to 13px, so em units follow. (jsdom lets
    // the base `font: inherit` win, so read the declared rules.)
    expect(declaredStyle(caption, 'font-size')).toBe('13px')
    expect(declaredStyle(caption, 'line-height')).toBe('1.4375em')
    expect(declaredStyle(caption, 'letter-spacing')).toBe('.00938em')
  })

  it('saves an edited caption on blur, and only when it changed', async () => {
    const { onSaveCaption } = renderTile()
    const caption = screen.getByRole('textbox')
    fireEvent.blur(caption)
    expect(onSaveCaption).not.toHaveBeenCalled()
    fireEvent.change(caption, { target: { value: 'Falls ' } })
    fireEvent.blur(caption)
    expect(onSaveCaption).not.toHaveBeenCalled()
    fireEvent.change(caption, { target: { value: 'Big falls' } })
    fireEvent.blur(caption)
    expect(onSaveCaption).toHaveBeenCalledWith('Big falls')
    // Disabled while the save is in flight.
    expect(caption.hasAttribute('disabled')).toBe(true)
    await waitFor(() => expect(caption.hasAttribute('disabled')).toBe(false))
  })

  it('runs the cover, reprocess and delete actions', () => {
    const { onSetCover, onReprocess, onDelete } = renderTile()
    fireEvent.click(screen.getByRole('button', { name: 'Use as cover' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Regenerate size variants' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete photo' }))
    expect(onSetCover).toHaveBeenCalledTimes(1)
    expect(onReprocess).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledTimes(1)
    const star = screen.getByRole('button', { name: 'Use as cover' })
    expect(star.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'StarBorder',
    )
    const actions = star.parentElement as HTMLElement
    expect(styleOf(actions, 'justify-content')).toBe('space-between')
  })

  it('marks the cover photo with a disabled filled star', () => {
    renderTile({ isCover: true })
    const star = screen.getByRole('button', { name: 'Cover photo' })
    expect(star.hasAttribute('disabled')).toBe(true)
    expect(star.querySelector('svg')?.getAttribute('data-icon')).toBe('Star')
  })

  it('disables every control while the page is busy', () => {
    renderTile({ disabled: true })
    for (const button of screen.getAllByRole('button')) {
      expect(button.hasAttribute('disabled')).toBe(true)
    }
    expect(screen.getByRole('textbox').hasAttribute('disabled')).toBe(true)
  })
})
