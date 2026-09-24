// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { styleOf } from '@/components/ui/test-utils'
import { counts } from '@/test/adminFixtures'
import {
  formatTimestamp,
  ImportProgress,
  StatusChip,
  statusColor,
} from './ImportStatus'

describe('statusColor', () => {
  it('maps statuses to chip colors', () => {
    expect(statusColor('done')).toBe('success')
    expect(statusColor('failed')).toBe('error')
    expect(statusColor('processing')).toBe('info')
    expect(statusColor('picking')).toBe('info')
    expect(statusColor('queued')).toBe('default')
    expect(statusColor('running')).toBe('default')
  })
})

describe('StatusChip', () => {
  it('renders a small outlined chip labelled with the status', () => {
    render(<StatusChip status="failed" />)
    const label = screen.getByText('failed')
    const chip = label.parentElement as HTMLElement
    expect(styleOf(chip, 'height')).toBe('24px')
    expect(styleOf(chip, 'border-top-width')).toBe('1px')
    expect(styleOf(chip, 'color')).toBe('#d32f2f')
  })
})

describe('ImportProgress', () => {
  it('shows a determinate bar and a done / failed / running summary', () => {
    render(
      <ImportProgress
        counts={counts({ total: 8, done: 3, failed: 1, processing: 2 })}
      />,
    )
    const summary = '3 / 8 done, 1 failed, 2 running'
    const bar = screen.getByRole('progressbar', { name: summary })
    expect(bar.getAttribute('aria-valuenow')).toBe('50')
    const caption = screen.getByText(summary)
    expect(caption.tagName).toBe('SPAN')
    expect(styleOf(caption, 'font-size')).toBe('0.75rem')
    // Not grey: main's `color="text.secondary"` never applied under Pigment.
    expect(styleOf(caption, 'color')).not.toBe('rgba(0, 0, 0, 0.6)')
    expect(styleOf(caption.parentElement as HTMLElement, 'min-width')).toBe(
      '160px',
    )
  })

  it('treats an import with no items as complete', () => {
    render(<ImportProgress counts={counts()} />)
    const bar = screen.getByRole('progressbar', { name: '0 / 0 done' })
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('formatTimestamp', () => {
  it('formats stored ISO timestamps as UTC minutes', () => {
    expect(formatTimestamp('2024-06-02T08:30:59.000Z')).toBe('2024-06-02 08:30')
    expect(formatTimestamp(null)).toBe('')
  })
})
