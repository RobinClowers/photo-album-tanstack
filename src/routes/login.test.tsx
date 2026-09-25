// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './login'

vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))

const renderLogin = (url = '/login') =>
  renderRoute(Route, { id: '/login', path: '/login', url })

describe('/login', () => {
  it('links the Google sign-in button to the OAuth start endpoint', async () => {
    renderLogin()
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Admin sign in' }),
    ).toBeTruthy()
    const button = screen.getByRole('link', { name: 'Sign in with Google' })
    expect(button.getAttribute('href')).toBe('/api/auth/google/login')
    expect(button.querySelector('svg[data-icon="Google"]')).not.toBeNull()
    expect(getComputedStyle(button).width).toBe('100%')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the message for a known error code', async () => {
    renderLogin('/login?error=not_admin')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(
      'That Google account is not an administrator of this site.',
    )
    expect(getComputedStyle(alert).textAlign).toBe('left')
  })
})
