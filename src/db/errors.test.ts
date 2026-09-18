import { describe, expect, it } from 'vitest'
import { uniqueConstraintColumns } from './errors'

describe('uniqueConstraintColumns', () => {
  it('reads the constraint from a bare SQLite error', () => {
    expect(
      uniqueConstraintColumns(
        new Error('UNIQUE constraint failed: albums.slug'),
      ),
    ).toBe('albums.slug')
  })

  it('reads the D1 error nested under a drizzle query error', () => {
    const d1 = new Error(
      'D1_ERROR: UNIQUE constraint failed: albums.title: SQLITE_CONSTRAINT',
    )
    const wrapped = new Error(
      'Failed query: insert into "albums" ("title") values (?)\nparams: Bangkok',
      { cause: d1 },
    )
    expect(uniqueConstraintColumns(wrapped)).toBe('albums.title')
  })

  it('keeps every column of a composite constraint', () => {
    expect(
      uniqueConstraintColumns(
        new Error(
          'D1_ERROR: UNIQUE constraint failed: photos.path, photos.filename: SQLITE_CONSTRAINT',
        ),
      ),
    ).toBe('photos.path, photos.filename')
  })

  it('returns null for other errors and non-errors', () => {
    expect(uniqueConstraintColumns(new Error('no such table: albums'))).toBe(
      null,
    )
    expect(uniqueConstraintColumns('a string')).toBe(null)
    expect(uniqueConstraintColumns(undefined)).toBe(null)
  })

  it('stops walking a cyclic cause chain', () => {
    const err = new Error('outer')
    err.cause = err
    expect(uniqueConstraintColumns(err)).toBe(null)
  })
})
