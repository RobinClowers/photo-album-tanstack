-- google_authorizations is rebuilt for the Google Photos Picker tokens: one
-- row per user (unique user_id) holding a single AES-GCM sealed JSON blob
-- instead of the Rails attr_encrypted column pairs. The legacy rows are not
-- copied: they were encrypted with the Rails app's keys and cannot be read
-- here, so admins reconnect Google Photos once from the album page. Dropping
-- the old table also drops its Rails-named indexes. No PRAGMA foreign_keys
-- toggling: the schema has no foreign keys.
CREATE TABLE `__new_google_authorizations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`scope` text NOT NULL,
	`encrypted_tokens` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `google_authorizations`;--> statement-breakpoint
ALTER TABLE `__new_google_authorizations` RENAME TO `google_authorizations`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_google_authorizations_user_id` ON `google_authorizations` (`user_id`);