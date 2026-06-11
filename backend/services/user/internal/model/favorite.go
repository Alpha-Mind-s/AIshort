package model

import "time"

type Favorite struct {
    ID        int64     `json:"id"`
    UserID    int64     `json:"user_id"`
    DramaID   int64     `json:"drama_id"`
    CreatedAt time.Time `json:"created_at"`
}

type AddFavoriteRequest struct {
    DramaID int64 `json:"drama_id" binding:"required"`
}
