import { eq } from 'drizzle-orm'
import type { DB } from './index'
import { type User, users } from './schema'

export async function getUserById(
  db: DB,
  id: number,
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id))
  return user
}

export async function getUserByEmail(
  db: DB,
  email: string,
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email))
  return user
}

/**
 * Find or create the user row for a Google account and record the Google
 * identity on it. `admin` mirrors the allowlist decision made by the caller.
 */
export async function upsertGoogleUser(
  db: DB,
  input: { email: string; sub: string; name?: string | null; admin: boolean },
): Promise<User> {
  const now = new Date().toISOString()
  const existing = await getUserByEmail(db, input.email)
  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        provider: 'google',
        uid: input.sub,
        name: input.name ?? existing.name,
        admin: input.admin,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id))
      .returning()
    return updated ?? existing
  }
  const [created] = await db
    .insert(users)
    .values({
      email: input.email,
      provider: 'google',
      uid: input.sub,
      name: input.name ?? null,
      admin: input.admin,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  if (!created) throw new Error('Failed to create user')
  return created
}
