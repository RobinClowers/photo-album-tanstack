import { z } from 'zod'

/**
 * What an import item asks the queue consumer to do. Stored as JSON in
 * `import_items.payload`; the queue message only carries the item id.
 */
export const importItemPayloadSchema = z.discriminatedUnion('task', [
  z.object({
    task: z.literal('reprocess-photo'),
    photoId: z.number().int().positive(),
    /** Regenerate every variant, not just the missing ones. */
    force: z.boolean(),
  }),
])

export type ImportItemPayload = z.infer<typeof importItemPayloadSchema>

export function parseImportItemPayload(text: string): ImportItemPayload {
  return importItemPayloadSchema.parse(JSON.parse(text))
}

export function serializeImportItemPayload(payload: ImportItemPayload) {
  return JSON.stringify(payload)
}
