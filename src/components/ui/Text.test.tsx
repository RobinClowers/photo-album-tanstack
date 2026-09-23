// @vitest-environment jsdom
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Text } from './Text'
import { renderWithRouter, styleOf } from './test-utils'

const overrides = stylex.create({ weight: { fontWeight: 700 } })

describe('Text', () => {
  it('renders body1 as a paragraph with the MUI type scale', () => {
    render(<Text>Hello</Text>)
    const el = screen.getByText('Hello')
    expect(el.tagName).toBe('P')
    expect(styleOf(el, 'font-size')).toBe('1rem')
    expect(styleOf(el, 'line-height')).toBe('1.5')
    expect(styleOf(el, 'letter-spacing')).toBe('0.00938em')
    expect(styleOf(el, 'margin-top')).toBe('0px')
  })

  it('maps variants to MUI default elements', () => {
    render(
      <>
        <Text variant="h4">Heading</Text>
        <Text variant="subtitle1">Subtitle</Text>
        <Text variant="caption">Caption</Text>
        <Text variant="overline">Overline</Text>
      </>,
    )
    expect(
      screen.getByRole('heading', { name: 'Heading', level: 4 }),
    ).toBeTruthy()
    expect(screen.getByText('Subtitle').tagName).toBe('H6')
    expect(screen.getByText('Caption').tagName).toBe('SPAN')
    expect(styleOf(screen.getByText('Overline'), 'text-transform')).toBe(
      'uppercase',
    )
    expect(styleOf(screen.getByText('Heading'), 'font-size')).toBe('2.125rem')
  })

  it('renders a different element with `as`', () => {
    render(
      <Text variant="h5" as="h2">
        Section
      </Text>,
    )
    const heading = screen.getByRole('heading', { name: 'Section', level: 2 })
    expect(styleOf(heading, 'font-size')).toBe('1.5rem')
  })

  it('applies color, align, gutterBottom, paragraph and noWrap', () => {
    render(
      <>
        <Text color="textSecondary" align="center" gutterBottom>
          Muted
        </Text>
        <Text paragraph>Para</Text>
        <Text noWrap>Long</Text>
        <Text color="error">Bad</Text>
      </>,
    )
    const muted = screen.getByText('Muted')
    expect(styleOf(muted, 'color')).toBe('rgba(0, 0, 0, 0.6)')
    expect(styleOf(muted, 'text-align')).toBe('center')
    expect(styleOf(muted, 'margin-bottom')).toBe('0.35em')
    expect(styleOf(screen.getByText('Para'), 'margin-bottom')).toBe('16px')
    expect(styleOf(screen.getByText('Long'), 'white-space')).toBe('nowrap')
    expect(styleOf(screen.getByText('Bad'), 'color')).toBe('#d32f2f')
  })

  it('lets xstyle override variant styles', () => {
    render(
      <Text variant="h6" xstyle={overrides.weight}>
        Bold
      </Text>,
    )
    expect(styleOf(screen.getByText('Bold'), 'font-weight')).toBe('700')
  })

  it('renders as a router link', async () => {
    renderWithRouter(
      <Text variant="subtitle1" render={<Link to="/admin" />}>
        Admin
      </Text>,
    )
    const link = await screen.findByRole('link', { name: 'Admin' })
    expect(link.getAttribute('href')).toBe('/admin')
    expect(styleOf(link, 'line-height')).toBe('1.75')
  })
})
