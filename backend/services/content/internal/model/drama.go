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

type CreateDramaRequest struct {
    Title       string          `json:"title" binding:"required,min=1,max=200"`
    Description string          `json:"description" binding:"required,min=1,max=2000"`
    CoverURL    string          `json:"cover_url" binding:"required,uri"`
    CategoryID  int             `json:"category_id" binding:"required"`
    Tags        json.RawMessage `json:"tags" binding:"required"`
    Status      string          `json:"status"` // defaults to "draft"
}

type UpdateDramaRequest struct {
    Title       *string         `json:"title,omitempty" binding:"omitempty,min=1,max=200"`
    Description *string         `json:"description,omitempty" binding:"omitempty,min=1,max=2000"`
    CoverURL    *string         `json:"cover_url,omitempty" binding:"omitempty,uri"`
    CategoryID  *int            `json:"category_id,omitempty"`
    Tags        json.RawMessage `json:"tags,omitempty"`
    Status      *string         `json:"status,omitempty"`
}

type UpdateStatusRequest struct {
    Status string `json:"status" binding:"required,oneof=draft published reviewing archived"`
}
