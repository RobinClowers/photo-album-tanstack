import { describe, expect, it } from 'vitest'
import { parseImportItemPayload, serializeImportItemPayload } from './items'

describe('import item payloads', () => {
  it('round-trips a reprocess task', () => {
    const text = serializeImportItemPayload({
      task: 'reprocess-photo',
      photoId: 42,
      force: true,
    })
    expect(text).toBe('{"task":"reprocess-photo","photoId":42,"force":true}')
    expect(parseImportItemPayload(text)).toEqual({
      task: 'reprocess-photo',
      photoId: 42,
      force: true,
    })
  })

  it('rejects unknown tasks and bad ids', () => {
    expect(() =>
      parseImportItemPayload('{"task":"teleport","photoId":1,"force":false}'),
    ).toThrow()
    expect(() =>
      parseImportItemPayload(
        '{"task":"reprocess-photo","photoId":0,"force":false}',
      ),
    ).toThrow()
    expect(() => parseImportItemPayload('not json')).toThrow()
  })
})
