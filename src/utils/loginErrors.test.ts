import { describe, expect, it } from 'vitest'
import { parseLoginError } from './loginErrors'

describe('parseLoginError', () => {
  it('accepts the known error codes', () => {
    expect(parseLoginError('oauth')).toBe('oauth')
    expect(parseLoginError('not_admin')).toBe('not_admin')
  })

  it('drops unknown values, including Object.prototype keys', () => {
    expect(parseLoginError('nope')).toBeUndefined()
    expect(parseLoginError('__proto__')).toBeUndefined()
    expect(parseLoginError('constructor')).toBeUndefined()
    expect(parseLoginError('toString')).toBeUndefined()
    expect(parseLoginError(undefined)).toBeUndefined()
  })
})
