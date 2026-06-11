CREATE TABLE IF NOT EXISTS video_assets (
    id BIGSERIAL PRIMARY KEY,
    episode_id BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    resolution VARCHAR(10) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration INT,
    codec VARCHAR(20),
    bitrate INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_assets_episode ON video_assets(episode_id);
