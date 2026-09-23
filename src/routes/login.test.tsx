// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
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

  // Main's `sx` on Paper/Typography and `color="text.secondary"` never
  // applied under Pigment; the page keeps that live look.
  it('matches the live layout of the MUI build', async () => {
    renderLogin()
    const title = await screen.findByRole('heading', { level: 1 })
    const paper = title.parentElement as HTMLElement
    // No padding declared at all (jsdom reports unset properties as '').
    expect(styleOf(paper, 'padding-top')).toBe('')
    expect(getComputedStyle(paper).textAlign).not.toBe('center')
    const intro = screen.getByText('Only the site administrator can sign in.')
    expect(styleOf(intro, 'margin-bottom')).toBe('0px')
    expect(styleOf(intro, 'color')).not.toBe('rgba(0, 0, 0, 0.6)')
  })

  it('shows the message for a known error code', async () => {
    renderLogin('/login?error=not_admin')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(
      'That Google account is not an administrator of this site.',
    )
    expect(styleOf(alert, 'margin-bottom')).toBe('')
  })
})
