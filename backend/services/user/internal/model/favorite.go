package model

import "time"

type Favorite struct {
    ID        int64        `json:"id"`
    UserID    int64        `json:"user_id"`
    DramaID   int64        `json:"drama_id"`
    Drama     *DramaSummary `json:"drama,omitempty"`
    CreatedAt time.Time    `json:"created_at"`
}

// DramaSummary is a lightweight drama reference for favorites display.
type DramaSummary struct {
    ID            int64    `json:"id"`
    Title         string   `json:"title"`
    CoverURL      string   `json:"cover_url"`
    Description   string   `json:"description"`
    TotalEpisodes int      `json:"total_episodes"`
    Tags          []string `json:"tags"`
}

type AddFavoriteRequest struct {
    DramaID int64 `json:"drama_id" binding:"required"`
}
