// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './admin'

vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }))

describe('/admin layout', () => {
  it('renders the admin bar and one toast region for every admin page', async () => {
    renderRoute(Route, {
      id: '/admin',
      path: '/admin',
      url: '/admin',
      context: { user: { id: 1, email: 'admin@example.com', name: null } },
    })
    expect(await screen.findByText('admin@example.com')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
    expect(
      screen.getAllByRole('region', { name: 'Notifications' }),
    ).toHaveLength(1)
  })
})
