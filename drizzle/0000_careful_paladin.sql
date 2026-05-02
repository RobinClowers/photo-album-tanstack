CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`cover_photo_id` integer,
	`created_at` text,
	`updated_at` text,
	`slug` text,
	`published_at` text,
	`first_photo_taken_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_albums_slug` ON `albums` (`slug`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`body` text,
	`user_id` integer,
	`photo_id` integer,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_comments_photo_id` ON `comments` (`photo_id`);--> statement-breakpoint
CREATE INDEX `idx_comments_user_id` ON `comments` (`user_id`);--> statement-breakpoint
CREATE TABLE `google_authorizations` (
	`id` integer NOT NULL,
	`scope` text,
	`token_type` text,
	`encrypted_access_token` text,
	`encrypted_access_token_iv` text,
	`encrypted_refresh_token` text,
	`encrypted_refresh_token_iv` text,
	`expires_at` text,
	`user_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_google_authorizations_user_id` ON `google_authorizations` (`user_id`);--> statement-breakpoint
CREATE TABLE `photo_versions` (
	`id` integer PRIMARY KEY NOT NULL,
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
CREATE INDEX `idx_photo_versions_photo_id` ON `photo_versions` (`photo_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text,
	`created_at` text,
	`updated_at` text,
	`path` text,
	`album_id` integer,
	`caption` text,
	`mime_type` text,
	`google_id` text,
	`taken_at` text,
	`width` integer,
	`height` integer,
	`camera_make` text,
	`camera_model` text,
	`focal_length` real,
	`aperture_f_number` real,
	`iso_equivalent` integer,
	`exposure_time` text,
	`lat` text,
	`lon` text
);
--> statement-breakpoint
CREATE INDEX `idx_photos_album_id` ON `photos` (`album_id`);--> statement-breakpoint
CREATE INDEX `idx_photos_taken_at` ON `photos` (`taken_at`);--> statement-breakpoint
CREATE TABLE `plus_ones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`photo_id` integer NOT NULL,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_plus_ones_user_photo` ON `plus_ones` (`user_id`,`photo_id`);--> statement-breakpoint
CREATE INDEX `idx_plus_ones_photo_id` ON `plus_ones` (`photo_id`);--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from` text,
	`to` text,
	`created_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_redirects_from` ON `redirects` (`from`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`uid` text,
	`provider` text,
	`name` text,
	`created_at` text,
	`updated_at` text,
	`admin` integer DEFAULT false,
	`encrypted_password` text DEFAULT '' NOT NULL,
	`reset_password_token` text,
	`reset_password_sent_at` text,
	`remember_created_at` text,
	`confirmation_token` text,
	`confirmed_at` text,
	`confirmation_sent_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_uid` ON `users` (`uid`);