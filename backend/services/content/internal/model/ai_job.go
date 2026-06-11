package model

import (
	"encoding/json"
	"time"
)

type AIJob struct {
	ID           int64            `json:"id"`
	EpisodeID    int64            `json:"episode_id"`
	JobType      string           `json:"job_type"`
	Status       string           `json:"status"`
	ResultMeta   json.RawMessage  `json:"result_meta,omitempty"`
	ErrorMessage *string          `json:"error_message,omitempty"`
	RetryCount   int              `json:"retry_count"`
	CreatedAt    time.Time        `json:"created_at"`
}

type AIJobStatusUpdate struct {
	Status       string          `json:"status" binding:"required,oneof=processing completed failed"`
	ResultMeta   json.RawMessage `json:"result_meta,omitempty"`
	ErrorMessage *string         `json:"error_message,omitempty"`
}

type LocalizationUpsert struct {
	Language        string  `json:"language" binding:"required"`
	TitleTranslated *string `json:"title_translated,omitempty"`
	SubtitleURL     *string `json:"subtitle_url,omitempty"`
	DubURL          *string `json:"dub_url,omitempty"`
	LipSyncURL      *string `json:"lip_sync_url,omitempty"`
	Status          string  `json:"status,omitempty"` // default "completed"
}
