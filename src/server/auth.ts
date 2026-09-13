import { env } from 'cloudflare:workers'
import { createDB } from '@/db'
import { getUserById } from '@/db/users'
import { isAdminEmail } from './admin-allowlist'
import { getAppSession } from './session'

export interface AdminUser {
  id: number
  email: string
  name: string | null
}

/**
 * The signed-in admin for the current request, or null. Re-checks the
 * allowlist on every call so removing an email from ADMIN_EMAILS takes
 * effect immediately, even for existing sessions.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getAppSession()
  const userId = session.data.userId
  if (!userId) return null

  const db = createDB(env.photo_album)
  const user = await getUserById(db, userId)
  if (!user || !isAdminEmail(user.email, env.ADMIN_EMAILS)) return null

  return { id: user.id, email: user.email, name: user.name }
}
