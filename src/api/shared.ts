import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { createDB } from '@/db'

/** A positive integer database id, the shape every admin input uses. */
export const id = z.number().int().positive()

export const db = () => createDB(env.photo_album)

/**
 * Validation failures end up in a Snackbar, and `ZodError.message` is a JSON
 * dump of every issue, so surface just the first message.
 */
export function validate<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  throw new Error(result.error.issues[0]?.message ?? 'Invalid input')
}
