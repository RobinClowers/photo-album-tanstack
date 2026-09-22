import { describe, expect, it } from 'vitest'
import { importTokenKey, open, seal } from './token-crypto'

const SECRET = btoa(
  String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i)),
)

describe('token sealing', () => {
  it('round-trips text', async () => {
    const key = await importTokenKey(SECRET)
    const sealed = await seal(key, '{"access_token":"ya29.x"}')
    expect(sealed).toMatch(/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/)
    expect(await open(key, sealed)).toBe('{"access_token":"ya29.x"}')
  })

  it('uses a fresh IV per call', async () => {
    const key = await importTokenKey(SECRET)
    expect(await seal(key, 'same')).not.toBe(await seal(key, 'same'))
  })

  it('rejects the wrong key and tampering', async () => {
    const key = await importTokenKey(SECRET)
    const other = await importTokenKey(
      btoa(String.fromCharCode(...Array.from({ length: 32 }, () => 7))),
    )
    const sealed = await seal(key, 'secret')
    await expect(open(other, sealed)).rejects.toThrow()
    await expect(open(key, `${sealed}A`)).rejects.toThrow()
    await expect(open(key, 'v0.abc.def')).rejects.toThrow('Unrecognised')
  })

  it('rejects a key that is not 32 bytes', async () => {
    await expect(importTokenKey(btoa('short'))).rejects.toThrow(
      '32 random bytes',
    )
  })
})
