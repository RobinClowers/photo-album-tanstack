// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithRouter, styleOf } from '@/components/ui/test-utils'
import { AdminBar } from './AdminBar'

const USER = { id: 1, email: 'admin@example.com', name: 'Admin' }

describe('AdminBar', () => {
  it('links to the admin sections and shows the signed-in email', async () => {
    renderWithRouter(<AdminBar user={USER} />)
    const brand = await screen.findByRole('link', { name: 'Admin' })
    expect(brand.getAttribute('href')).toBe('/admin')
    expect(styleOf(brand, 'font-weight')).toBe('500')
    expect(styleOf(brand, 'text-decoration')).toBe('none')
    expect(
      screen.getByRole('link', { name: 'Albums' }).getAttribute('href'),
    ).toBe('/admin')
    const imports = screen.getByRole('link', { name: 'Imports' })
    expect(imports.getAttribute('href')).toBe('/admin/imports')
    expect(styleOf(imports, 'text-transform')).toBe('uppercase')
    const email = screen.getByText('admin@example.com')
    expect(email.tagName).toBe('P')
    // Secondary grey, as main's `color="text.secondary"` intended.
    expect(styleOf(email, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    const bar = brand.parentElement?.parentElement as HTMLElement
    expect(styleOf(bar, 'background-color')).toBe('#f5f5f5')
    expect(styleOf(bar, 'border-bottom-width')).toBe('1px')
    expect(styleOf(bar, 'border-bottom-color')).toBe('rgba(0, 0, 0, 0.12)')
  })

  it('signs out with a POST form', async () => {
    renderWithRouter(<AdminBar user={USER} />)
    const button = await screen.findByRole('button', { name: 'Sign out' })
    expect(button.getAttribute('type')).toBe('submit')
    const form = button.closest('form') as HTMLFormElement
    expect(form.getAttribute('method')).toBe('post')
    expect(form.getAttribute('action')).toBe('/api/auth/logout')
  })
})
