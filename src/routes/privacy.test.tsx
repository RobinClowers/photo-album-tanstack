// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { renderRoute } from '@/test/renderRoute'
import { Route } from './privacy'

describe('/privacy', () => {
  it('renders the policy sections with MUI typography', async () => {
    renderRoute(Route, { id: '/privacy', path: '/privacy', url: '/privacy' })
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'Privacy policy',
    })
    expect(styleOf(title, 'font-size')).toBe('2.125rem')
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      'Visitors',
      'Administrator sign-in with Google',
      'Sharing',
      'Contact',
    ])
  })

  // Main's `sx` margins and `color="text.secondary"` on Typography never
  // applied under Pigment; the page keeps that live look.
  it('matches the live spacing and colour of the MUI build', async () => {
    renderRoute(Route, { id: '/privacy', path: '/privacy', url: '/privacy' })
    const visitors = await screen.findByRole('heading', { name: 'Visitors' })
    expect(styleOf(visitors, 'margin-top')).toBe('0px')
    expect(getComputedStyle(visitors).marginBottom).toBe('0.35em')
    const intro = screen.getByText(/^Robinʼs Photos is a personal/)
    expect(styleOf(intro, 'margin-top')).toBe('0px')
    expect(styleOf(intro, 'margin-bottom')).toBe('16px')
    const updated = screen.getByText(/^Last updated/)
    // Inherits the body text colour rather than MUI text.secondary.
    expect(styleOf(updated, 'color')).not.toBe('rgba(0, 0, 0, 0.6)')
  })

  it('links to the Google policy and the contact address', async () => {
    renderRoute(Route, { id: '/privacy', path: '/privacy', url: '/privacy' })
    const policy = await screen.findByRole('link', {
      name: 'Google API Services User Data Policy',
    })
    expect(policy.getAttribute('href')).toBe(
      'https://developers.google.com/terms/api-services-user-data-policy',
    )
    expect(policy.getAttribute('target')).toBe('_blank')
    expect(policy.getAttribute('rel')).toBe('noreferrer')
    expect(getComputedStyle(policy).textDecorationLine).toBe('underline')
    expect(
      screen
        .getByRole('link', { name: 'robin@poggiolabs.com' })
        .getAttribute('href'),
    ).toBe('mailto:robin@poggiolabs.com')
  })
})
