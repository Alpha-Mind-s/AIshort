CREATE TABLE IF NOT EXISTS dramas (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    cover_url VARCHAR(500),
    category_id INT REFERENCES categories(id),
    creator_id BIGINT REFERENCES users(id),
    total_episodes INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    tags JSONB NOT NULL DEFAULT '[]',
    release_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dramas_creator ON dramas(creator_id);
CREATE INDEX IF NOT EXISTS idx_dramas_category ON dramas(category_id);
CREATE INDEX IF NOT EXISTS idx_dramas_status ON dramas(status);
CREATE INDEX IF NOT EXISTS idx_dramas_release ON dramas(release_at);
CREATE INDEX IF NOT EXISTS idx_dramas_tags ON dramas USING GIN(tags);
