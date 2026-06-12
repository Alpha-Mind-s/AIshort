ALTER TABLE dramas ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dramas_view_count ON dramas(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_view_count ON episodes(view_count DESC);
