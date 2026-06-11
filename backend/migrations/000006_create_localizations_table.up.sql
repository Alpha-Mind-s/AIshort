CREATE TABLE IF NOT EXISTS localizations (
    id BIGSERIAL PRIMARY KEY,
    episode_id BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL,
    title_translated VARCHAR(500),
    dub_url VARCHAR(500),
    subtitle_url VARCHAR(500),
    lip_sync_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_localizations_episode ON localizations(episode_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_localizations_episode_lang ON localizations(episode_id, language);
