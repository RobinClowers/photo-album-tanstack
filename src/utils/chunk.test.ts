import { describe, expect, it } from 'vitest'
import { chunk } from './chunk'

describe('chunk', () => {
  it('splits into slices of the given size with a shorter tail', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns one slice when everything fits', () => {
    expect(chunk(['a', 'b'], 5)).toEqual([['a', 'b']])
  })

  it('returns nothing for no items', () => {
    expect(chunk([], 3)).toEqual([])
  })

  it('rejects a non-positive or fractional size', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError)
    expect(() => chunk([1], 1.5)).toThrow(RangeError)
  })
})
