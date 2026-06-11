package model

import "time"

type Comment struct {
    ID         int64      `json:"id"`
    UserID     int64      `json:"-"`
    DramaID    int64      `json:"drama_id"`
    ParentID   *int64     `json:"parent_id"`
    Content    string     `json:"content"`
    LikesCount int        `json:"likes_count"`
    Status     string     `json:"-"`
    CreatedAt  time.Time  `json:"created_at"`
    UpdatedAt  time.Time  `json:"updated_at"`
    User       *User      `json:"user,omitempty"`
    IsLiked    bool       `json:"is_liked"`
}

type CreateCommentRequest struct {
    Content  string `json:"content" binding:"required,min=1,max=2000"`
    ParentID *int64 `json:"parent_id"`
}
