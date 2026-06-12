DROP INDEX IF EXISTS idx_dramas_view_count;
DROP INDEX IF EXISTS idx_episodes_view_count;

ALTER TABLE dramas DROP COLUMN IF EXISTS view_count;
ALTER TABLE episodes DROP COLUMN IF EXISTS view_count;
