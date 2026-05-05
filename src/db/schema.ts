import {
  sqliteTable,
  text,
  integer,
  real,
  index,
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
    slugIdx: index('idx_albums_slug').on(table.slug),
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
    id: integer('id').primaryKey(),
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

export const googleAuthorizations = sqliteTable(
  'google_authorizations',
  {
    id: integer('id').notNull(),
    scope: text('scope'),
    tokenType: text('token_type'),
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedAccessTokenIv: text('encrypted_access_token_iv'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    encryptedRefreshTokenIv: text('encrypted_refresh_token_iv'),
    expiresAt: text('expires_at'),
    userId: integer('user_id'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_google_authorizations_user_id').on(table.userId),
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

