package model

import (
    "encoding/json"
    "time"
)

type Drama struct {
    ID            int64           `json:"id"`
    Title         string          `json:"title"`
    Description   string          `json:"description"`
    CoverURL      string          `json:"cover_url"`
    CategoryID    *int            `json:"category_id"`
    CreatorID     int64           `json:"creator_id"`
    TotalEpisodes int             `json:"total_episodes"`
    Status        string          `json:"status"`
    Tags          json.RawMessage `json:"tags"`
    ReleaseAt     *time.Time      `json:"release_at"`
    CreatedAt     time.Time       `json:"created_at"`
    UpdatedAt     time.Time       `json:"updated_at"`
    ViewCount     int             `json:"view_count"`
    LikeCount     int             `json:"like_count"`
    FavoriteCount int             `json:"favorite_count"`
}
