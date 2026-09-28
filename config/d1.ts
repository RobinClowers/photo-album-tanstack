/**
 * The app's D1 databases, shared by cloudflare.config.ts (the `photo_album`
 * binding) and the scripts that run migrations and SQL against them: `cf d1`
 * commands only accept a database id, never a binding or database name.
 */
export const D1_DATABASES = {
  production: {
    name: 'photo-album',
    id: 'a4770c33-29a8-46c4-8b79-f9de04296754',
  },
  staging: {
    name: 'photo-album-staging',
    id: 'ff34cff0-f26c-496f-8bc6-7864c2e6906b',
  },
} as const

export type D1Environment = keyof typeof D1_DATABASES

/** Drizzle's output directory, flat `NNNN_name.sql` files. */
export const D1_MIGRATIONS_DIR = 'drizzle'
