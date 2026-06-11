CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drama_id BIGINT NOT NULL REFERENCES dramas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_drama ON favorites(user_id, drama_id);
