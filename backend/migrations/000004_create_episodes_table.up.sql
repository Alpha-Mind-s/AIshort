CREATE TABLE IF NOT EXISTS episodes (
    id BIGSERIAL PRIMARY KEY,
    drama_id BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    episode_no INT NOT NULL,
    title VARCHAR(500),
    duration INT,
    video_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_drama ON episodes(drama_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_drama_no ON episodes(drama_id, episode_no);
