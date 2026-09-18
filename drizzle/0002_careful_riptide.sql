-- imports / import_items back the image pipeline (progress, retries).
--
-- photo_versions is rebuilt because the Rails-era table has `id INTEGER NOT
-- NULL` with no primary key, so inserts had to supply ids by hand. The copy
-- keeps every id; SQLite seeds the AUTOINCREMENT counter from the max copied
-- id. Dropping the old table also drops its Rails-named indexes
-- (index_photo_versions_on_photo_id[_and_size]), which are recreated with the
-- drizzle names below. No PRAGMA foreign_keys toggling: the schema has no
-- foreign keys.
CREATE TABLE `import_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`import_id` integer NOT NULL,
	`photo_id` integer,
	`filename` text,
	`google_media_id` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`started_at` text,
	`finished_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_import_items_import_id` ON `import_items` (`import_id`);--> statement-breakpoint
CREATE INDEX `idx_import_items_status` ON `import_items` (`status`);--> statement-breakpoint
CREATE TABLE `imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`album_id` integer,
	`kind` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`created_by_user_id` integer,
	`error` text,
	`google_session_id` text,
	`google_session_expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`finished_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_imports_album_id` ON `imports` (`album_id`);--> statement-breakpoint
CREATE TABLE `__new_photo_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`size` text,
	`mime_type` text,
	`width` integer,
	`height` integer,
	`photo_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`filename` text
);
--> statement-breakpoint
INSERT INTO `__new_photo_versions`("id", "size", "mime_type", "width", "height", "photo_id", "created_at", "updated_at", "filename") SELECT "id", "size", "mime_type", "width", "height", "photo_id", "created_at", "updated_at", "filename" FROM `photo_versions`;--> statement-breakpoint
DROP TABLE `photo_versions`;--> statement-breakpoint
ALTER TABLE `__new_photo_versions` RENAME TO `photo_versions`;--> statement-breakpoint
CREATE INDEX `idx_photo_versions_photo_id` ON `photo_versions` (`photo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_photo_versions_photo_id_size` ON `photo_versions` (`photo_id`,`size`);