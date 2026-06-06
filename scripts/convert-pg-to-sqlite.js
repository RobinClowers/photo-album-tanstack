import { readFileSync, writeFileSync } from 'fs'

let sql = readFileSync('tmp/backup.sql', 'utf8')

// Remove PostgreSQL administrative commands
sql = sql.replace(/SET\s+[\s\S]*?;/g, '')
sql = sql.replace(/SELECT pg_catalog\.[\s\S]*?;/g, '')

// Remove sequences entirely
sql = sql.replace(/CREATE SEQUENCE[\s\S]*?;/g, '')
sql = sql.replace(/ALTER SEQUENCE[\s\S]*?;/g, '')

// Remove ALTER TABLE statements (SQLite has limited ALTER support)
sql = sql.replace(/ALTER TABLE( ONLY)?[\s\S]*?;/g, '')

// Remove rails internal table and related statements
sql = sql.replace(/CREATE TABLE.*?ar_internal_metadata[\s\S]*?;/g, '')
sql = sql.replace(/ALTER TABLE.*?ar_internal_metadata[\s\S]*?;/g, '')
sql = sql.replace(/INSERT INTO.*?ar_internal_metadata[\s\S]*?;/gm, '')
sql = sql.replace(/COPY.*?ar_internal_metadata[\s\S]*?\\\.[\s\S]*?;/gm, '')

sql = sql.replace(/CREATE TABLE.*?schema_migrations[\s\S]*?;/g, '')
sql = sql.replace(/ALTER TABLE.*?schema_migrations[\s\S]*?;/g, '')
sql = sql.replace(/INSERT INTO.*?schema_migrations[\s\S]*?;/gm, '')
sql = sql.replace(/COPY.*?schema_migrations[\s\S]*?\\\.[\s\S]*?;/gm, '')
sql = sql.replace(/CREATE.*INDEX.*schema_migrations[\s\S]*?;/g, '')

// Convert ONLY the id column to auto-increment (must be first in table)
sql = sql.replace(
  /\bid integer NOT NULL,/g,
  'id INTEGER PRIMARY KEY AUTOINCREMENT,',
)

// Convert other data types
sql = sql.replace(/character varying(\(\d+\))?/g, 'TEXT')
sql = sql.replace(/timestamp without time zone/g, 'TEXT')
sql = sql.replace(/\binteger NOT NULL\b/g, 'INTEGER NOT NULL')
sql = sql.replace(/\binteger\b/g, 'INTEGER')
sql = sql.replace(/\bbigint NOT NULL\b/g, 'INTEGER NOT NULL')
sql = sql.replace(/\bbigint\b/g, 'INTEGER')
sql = sql.replace(/::[\w]+/g, '') // Remove type casts

// Remove PostgreSQL-specific stuff
sql = sql.replace(/public\./g, '')

// Remove comments more carefully - only remove lines that start with --
sql = sql.replace(/^[ \t]*--.*$/gm, '')

// Remove remaining partial comment lines from ALTER statements
sql = sql.replace(/^[ \t]*Type:.*$/gm, '')
sql = sql.replace(/^[ \t]*Schema:.*$/gm, '')
sql = sql.replace(/^[ \t]*Owner:.*$/gm, '')
sql = sql.replace(/^[ \t]*Tablespace:.*$/gm, '')
sql = sql.replace(/^[ \t]*DEFAULT.*$/gm, '')
sql = sql.replace(/^[ \t]*NOT NULL.*$/gm, '')
sql = sql.replace(/^[ \t]*NULL.*$/gm, '')

// Convert PostgreSQL indexes to SQLite syntax
sql = sql.replace(
  /CREATE UNIQUE INDEX ([\w]+) ON (\w+) USING btree \(([\w",\s]+)\);/g,
  'CREATE UNIQUE INDEX $1 ON $2 ($3);',
)
sql = sql.replace(
  /CREATE INDEX ([\w]+) ON (\w+) USING btree \(([\w",\s]+)\);/g,
  'CREATE INDEX $1 ON $2 ($3);',
)
sql = sql.replace(
  /CREATE UNIQUE INDEX ([\w]+) ON (\w+) \(([\w",\s]+)\);/g,
  'CREATE UNIQUE INDEX $1 ON $2 ($3);',
)
sql = sql.replace(
  /CREATE INDEX ([\w]+) ON (\w+) \(([\w",\s]+)\);/g,
  'CREATE INDEX $1 ON $2 ($3);',
)

writeFileSync('tmp/d1-converted-backup.sql', sql)
