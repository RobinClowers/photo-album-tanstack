import { eq } from 'drizzle-orm'
import type { DB } from './index'
import { type GoogleAuthorization, googleAuthorizations } from './schema'

/** What the sealed `encrypted_tokens` blob holds. */
export interface GoogleTokens {
  accessToken: string
  /** Absent when Google did not issue one (no offline access granted). */
  refreshToken: string | null
  /** ISO 8601 access token expiry. */
  expiresAt: string
}

export async function getGoogleAuthorization(
  db: DB,
  userId: number,
): Promise<GoogleAuthorization | undefined> {
  const [row] = await db
    .select()
    .from(googleAuthorizations)
    .where(eq(googleAuthorizations.userId, userId))
  return row
}

/**
 * Store (or replace) a user's grant. One row per user, updated in place: the
 * Rails app inserted a new row on every re-auth and accumulated duplicates.
 */
export async function upsertGoogleAuthorization(
  db: DB,
  data: {
    userId: number
    scope: string
    encryptedTokens: string
    expiresAt: string
  },
): Promise<GoogleAuthorization> {
  const now = new Date().toISOString()
  const [row] = await db
    .insert(googleAuthorizations)
    .values({ ...data, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: googleAuthorizations.userId,
      set: {
        scope: data.scope,
        encryptedTokens: data.encryptedTokens,
        expiresAt: data.expiresAt,
        updatedAt: now,
      },
    })
    .returning()
  if (!row) throw new Error('Failed to store Google authorization')
  return row
}

export async function deleteGoogleAuthorization(
  db: DB,
  userId: number,
): Promise<void> {
  await db
    .delete(googleAuthorizations)
    .where(eq(googleAuthorizations.userId, userId))
}
