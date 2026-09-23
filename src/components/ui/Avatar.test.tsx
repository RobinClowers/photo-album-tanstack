// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'
import { styleOf } from './test-utils'

describe('Avatar', () => {
  it('server-renders the image over the fallback', () => {
    const { container } = render(
      <Avatar src="/cover.jpg" alt="Cover" variant="rounded" />,
    )
    const img = container.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/cover.jpg')
    // Hidden until it has loaded.
    expect(img.hasAttribute('data-loading')).toBe(true)
    expect(styleOf(img, 'visibility')).toBe('hidden')
    const root = img.parentElement as HTMLElement
    expect(styleOf(root, 'width')).toBe('40px')
    expect(styleOf(root, 'border-radius')).toBe('4px')
    expect(root.querySelector('svg')?.getAttribute('data-icon')).toBe('Person')
  })

  it('shows the person icon without src', () => {
    const { container } = render(<Avatar />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'Person',
    )
    expect(
      styleOf(container.firstElementChild as Element, 'border-radius'),
    ).toBe('50%')
  })

  it('renders custom fallback content', () => {
    render(<Avatar>RC</Avatar>)
    expect(screen.getByText('RC')).toBeTruthy()
  })
})
