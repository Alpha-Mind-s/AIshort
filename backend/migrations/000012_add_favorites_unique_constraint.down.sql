-- Drop unique constraint on favorites (user_id, drama_id)
DROP INDEX IF EXISTS idx_favorites_user_drama;
