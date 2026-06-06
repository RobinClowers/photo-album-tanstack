import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function createDB(D1Database: D1Database) {
  return drizzle(D1Database, { schema })
}

export type DB = ReturnType<typeof createDB>

export { schema }
