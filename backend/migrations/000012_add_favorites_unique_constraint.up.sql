-- Add unique constraint on favorites (user_id, drama_id) to prevent duplicates at DB level
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_user_drama ON favorites(user_id, drama_id);
