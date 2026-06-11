package model

import "time"

type Category struct {
    ID        int         `json:"id"`
    Name      string      `json:"name"`
    Slug      string      `json:"slug"`
    ParentID  *int        `json:"parent_id"`
    SortOrder int         `json:"sort_order"`
    CreatedAt time.Time   `json:"created_at"`
    Children  []*Category `json:"children,omitempty"`
}
