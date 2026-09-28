import { describe, expect, it } from 'vitest'
import { batchStatements, splitSqlStatements } from './sql'

describe('splitSqlStatements', () => {
  it('splits on semicolons and trims', () => {
    expect(splitSqlStatements('select 1;\n select 2 ;select 3')).toEqual([
      'select 1;',
      'select 2 ;',
      'select 3',
    ])
  })

  it('ignores semicolons in strings, identifiers and comments', () => {
    const sql = [
      "INSERT INTO t VALUES('a;b', 'it''s; fine');",
      '-- a comment; with a semicolon',
      'SELECT "x;y", `z;`, [w;] FROM t; /* block; */ SELECT 2;',
    ].join('\n')
    expect(splitSqlStatements(sql)).toEqual([
      "INSERT INTO t VALUES('a;b', 'it''s; fine');",
      'SELECT "x;y", `z;`, [w;] FROM t;',
      'SELECT 2;',
    ])
  })

  it('keeps a trigger body in one statement', () => {
    const sql =
      'CREATE TRIGGER t AFTER INSERT ON a BEGIN UPDATE b SET n = 1; DELETE FROM c; END;\nSELECT 1;'
    expect(splitSqlStatements(sql)).toEqual([
      'CREATE TRIGGER t AFTER INSERT ON a BEGIN UPDATE b SET n = 1; DELETE FROM c; END;',
      'SELECT 1;',
    ])
  })

  it('returns nothing for comments and whitespace only', () => {
    expect(splitSqlStatements('  -- nothing\n/* here */ ')).toEqual([])
  })
})

describe('batchStatements', () => {
  it('starts a new batch before exceeding the size limit', () => {
    expect(batchStatements(['aaaa', 'bbbb', 'cc', 'dddddddd'], 10)).toEqual([
      ['aaaa', 'bbbb', 'cc'],
      ['dddddddd'],
    ])
  })

  it('keeps an oversized statement in a batch of its own', () => {
    expect(batchStatements(['a', 'x'.repeat(20), 'b'], 10)).toEqual([
      ['a'],
      ['x'.repeat(20)],
      ['b'],
    ])
  })
})
