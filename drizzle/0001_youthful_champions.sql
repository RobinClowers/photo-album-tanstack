-- Guarded because the legacy (Rails-created) database indexes albums.slug as
-- `index_albums_on_slug` and has no `idx_albums_slug`, while a database built
-- from the 0000 baseline has the non-unique `idx_albums_slug`. This applies
-- cleanly to both and leaves albums.slug unique either way.
DROP INDEX IF EXISTS `idx_albums_slug`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_albums_slug` ON `albums` (`slug`);
