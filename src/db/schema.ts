import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const albums = sqliteTable(
  'albums',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title'),
    coverPhotoId: integer('cover_photo_id'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    slug: text('slug'),
    publishedAt: text('published_at'),
    firstPhotoTakenAt: text('first_photo_taken_at'),
  },
  (table) => ({
    // Unique: the public /albums/$slug lookup must resolve to one album, and
    // a check-then-insert in the admin cannot prevent a duplicate on its own.
    slugIdx: uniqueIndex('idx_albums_slug').on(table.slug),
  }),
)

export const photos = sqliteTable(
  'photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filename: text('filename'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    path: text('path'),
    albumId: integer('album_id'),
    caption: text('caption'),
    mimeType: text('mime_type'),
    googleId: text('google_id'),
    takenAt: text('taken_at'),
    width: integer('width'),
    height: integer('height'),
    cameraMake: text('camera_make'),
    cameraModel: text('camera_model'),
    focalLength: real('focal_length'),
    apertureFNumber: real('aperture_f_number'),
    isoEquivalent: integer('iso_equivalent'),
    exposureTime: text('exposure_time'),
    lat: text('lat'),
    lon: text('lon'),
  },
  (table) => ({
    albumIdIdx: index('idx_photos_album_id').on(table.albumId),
    takenAtIdx: index('idx_photos_taken_at').on(table.takenAt),
  }),
)

export const photoVersions = sqliteTable(
  'photo_versions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    size: text('size'),
    mimeType: text('mime_type'),
    width: integer('width'),
    height: integer('height'),
    photoId: integer('photo_id'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    filename: text('filename'),
  },
  (table) => ({
    photoIdIdx: index('idx_photo_versions_photo_id').on(table.photoId),
    // One row per size; the pipeline upserts on this pair.
    photoIdSizeIdx: uniqueIndex('idx_photo_versions_photo_id_size').on(
      table.photoId,
      table.size,
    ),
  }),
)

/**
 * A batch of pipeline work: reprocessing an album's variants, or (PR 5) a
 * Google Photos import. Progress is derived from import_items, not stored.
 */
export const imports = sqliteTable(
  'imports',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    albumId: integer('album_id'),
    /** 'reprocess' | 'google' */
    kind: text('kind').notNull(),
    /** 'running' | 'done' | 'failed' */
    status: text('status').notNull().default('running'),
    createdByUserId: integer('created_by_user_id'),
    error: text('error'),
    googleSessionId: text('google_session_id'),
    googleSessionExpiresAt: text('google_session_expires_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    finishedAt: text('finished_at'),
  },
  (table) => ({
    albumIdIdx: index('idx_imports_album_id').on(table.albumId),
  }),
)

/**
 * One unit of queue work. The queue message carries only the item id; the
 * row is the source of truth for what to do (`payload`), how often it has
 * been tried, and why it last failed, so a lost or expired message can be
 * re-enqueued from the table.
 */
export const importItems = sqliteTable(
  'import_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    importId: integer('import_id').notNull(),
    photoId: integer('photo_id'),
    filename: text('filename'),
    googleMediaId: text('google_media_id'),
    /** 'queued' | 'processing' | 'done' | 'failed' */
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    /** JSON, see ImportItemPayload in src/server/pipeline/items.ts */
    payload: text('payload').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
  },
  (table) => ({
    importIdIdx: index('idx_import_items_import_id').on(table.importId),
    statusIdx: index('idx_import_items_status').on(table.status),
  }),
)

export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    body: text('body'),
    userId: integer('user_id'),
    photoId: integer('photo_id'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    photoIdIdx: index('idx_comments_photo_id').on(table.photoId),
    userIdIdx: index('idx_comments_user_id').on(table.userId),
  }),
)

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').default('').notNull(),
    uid: text('uid'),
    provider: text('provider'),
    name: text('name'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
    admin: integer('admin', { mode: 'boolean' }).default(false),
    encryptedPassword: text('encrypted_password').default('').notNull(),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordSentAt: text('reset_password_sent_at'),
    rememberCreatedAt: text('remember_created_at'),
    confirmationToken: text('confirmation_token'),
    confirmedAt: text('confirmed_at'),
    confirmationSentAt: text('confirmation_sent_at'),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    uidIdx: index('idx_users_uid').on(table.uid),
  }),
)

/**
 * One Google OAuth grant per user for the Photos Picker scope. The tokens
 * (access, refresh, expiry) are one AES-GCM sealed JSON blob, see
 * src/server/token-crypto.ts. Rebuilt from the Rails attr_encrypted layout in
 * migration 0003; the legacy rows were unreadable without the Rails keys.
 */
export const googleAuthorizations = sqliteTable(
  'google_authorizations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    /** Space-separated scopes Google reported as granted. */
    scope: text('scope').notNull(),
    /** Sealed JSON: { accessToken, refreshToken, expiresAt }. */
    encryptedTokens: text('encrypted_tokens').notNull(),
    /** Access token expiry, ISO 8601; duplicated outside the blob for queries. */
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('idx_google_authorizations_user_id').on(
      table.userId,
    ),
  }),
)

export const plusOnes = sqliteTable(
  'plus_ones',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull(),
    photoId: integer('photo_id').notNull(),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    userIdPhotoIdIdx: index('idx_plus_ones_user_photo').on(
      table.userId,
      table.photoId,
    ),
    photoIdIdx: index('idx_plus_ones_photo_id').on(table.photoId),
  }),
)

export const redirects = sqliteTable(
  'redirects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    from: text('from'),
    to: text('to'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
  },
  (table) => ({
    fromIdx: index('idx_redirects_from').on(table.from),
  }),
)

export type Album = typeof albums.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
export type PhotoVersion = typeof photoVersions.$inferSelect
export type NewPhotoVersion = typeof photoVersions.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type GoogleAuthorization = typeof googleAuthorizations.$inferSelect
export type NewGoogleAuthorization = typeof googleAuthorizations.$inferInsert
export type PlusOne = typeof plusOnes.$inferSelect
export type NewPlusOne = typeof plusOnes.$inferInsert
export type Redirect = typeof redirects.$inferSelect
export type NewRedirect = typeof redirects.$inferInsert
export type Import = typeof imports.$inferSelect
export type NewImport = typeof imports.$inferInsert
export type ImportItem = typeof importItems.$inferSelect
export type NewImportItem = typeof importItems.$inferInsert

export const albumsRelations = relations(albums, ({ one, many }) => ({
  cover_photo: one(photos, {
    fields: [albums.coverPhotoId],
    references: [photos.id],
  }),
  photos: many(photos),
}))

export const photosRelations = relations(photos, ({ one, many }) => ({
  album: one(albums, {
    fields: [photos.albumId],
    references: [albums.id],
  }),
  versions: many(photoVersions),
}))

export const photoVersionsRelations = relations(photoVersions, ({ one }) => ({
  photo: one(photos, {
    fields: [photoVersions.photoId],
    references: [photos.id],
  }),
}))

export const importsRelations = relations(imports, ({ one, many }) => ({
  album: one(albums, {
    fields: [imports.albumId],
    references: [albums.id],
  }),
  items: many(importItems),
}))

export const importItemsRelations = relations(importItems, ({ one }) => ({
  import: one(imports, {
    fields: [importItems.importId],
    references: [imports.id],
  }),
  photo: one(photos, {
    fields: [importItems.photoId],
    references: [photos.id],
  }),
}))
