import { describe, expect, it } from 'vitest'
import { MAX_ATTEMPTS, retryDelaySeconds } from './retry'

describe('retryDelaySeconds', () => {
  it('doubles from thirty seconds', () => {
    expect(retryDelaySeconds(1)).toBe(30)
    expect(retryDelaySeconds(2)).toBe(60)
    expect(retryDelaySeconds(3)).toBe(120)
  })

  it('caps at ten minutes', () => {
    expect(retryDelaySeconds(10)).toBe(600)
  })

  it('tolerates a zero or negative attempt count', () => {
    expect(retryDelaySeconds(0)).toBe(30)
  })

  it('gives four attempts', () => {
    expect(MAX_ATTEMPTS).toBe(4)
  })
})
