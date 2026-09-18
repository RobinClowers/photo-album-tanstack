import { z } from 'zod'

/** The subset of a picked Google media item the import needs, as stored. */
export const pickedItemSchema = z.object({
  /** Picker media item id; stored as photos.google_id. */
  id: z.string().min(1),
  baseUrl: z.string().url(),
  /** Already scrubbed (see scrubFilename). */
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  /** RFC 3339 from Google. */
  createTime: z.string().min(1),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  cameraMake: z.string().nullable(),
  cameraModel: z.string().nullable(),
  focalLength: z.number().nullable(),
  apertureFNumber: z.number().nullable(),
  isoEquivalent: z.number().int().nullable(),
  /** Seconds, parsed from Google's "0.001s". */
  exposureSeconds: z.number().nullable(),
})

export type PickedItemPayload = z.infer<typeof pickedItemSchema>

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
  z.object({
    task: z.literal('google-import'),
    albumId: z.number().int().positive(),
    item: pickedItemSchema,
  }),
])

export type ImportItemPayload = z.infer<typeof importItemPayloadSchema>

export function parseImportItemPayload(text: string): ImportItemPayload {
  return importItemPayloadSchema.parse(JSON.parse(text))
}

export function serializeImportItemPayload(payload: ImportItemPayload) {
  return JSON.stringify(payload)
}
