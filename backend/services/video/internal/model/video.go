package model

import "time"

type UploadURLRequest struct {
	Filename    string `json:"filename" binding:"required"`
	FileSize    int64  `json:"file_size" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
}

type UploadURLResponse struct {
	UploadURL   string `json:"upload_url"`
	DownloadURL string `json:"download_url"`
	ExpiresIn   int64  `json:"expires_in"`
}

type MultipartInitRequest struct {
	Filename    string `json:"filename" binding:"required"`
	FileSize    int64  `json:"file_size" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
}

type MultipartInitResponse struct {
	UploadID string `json:"upload_id"`
	PartSize int64  `json:"part_size"`
	Parts    int    `json:"parts"`
}

type MultipartCompleteRequest struct {
	UploadID string `json:"upload_id" binding:"required"`
	Parts    []Part `json:"parts" binding:"required"`
}

type Part struct {
	PartNumber int    `json:"part_number"`
	ETag       string `json:"etag"`
}

type VideoAsset struct {
	ID         int64  `json:"id"`
	EpisodeID  int64  `json:"episode_id"`
	Resolution string `json:"resolution"`
	FileURL    string `json:"file_url"`
	FileSize   int64  `json:"file_size"`
	Duration   int    `json:"duration"`
	Status     string `json:"status"`
}

type UploadCompleteRequest struct {
	UploadID  string `json:"upload_id" binding:"required"`
	EpisodeID int64  `json:"episode_id" binding:"required"`
	Duration  *int   `json:"duration,omitempty"`
	FileSize  int64  `json:"file_size,omitempty"`
}

type UploadCompleteResponse struct {
	VideoURL string `json:"video_url"`
	Duration int    `json:"duration"`
	Status   string `json:"status"`
}

type UploadSession struct {
	UploadID    string
	ObjectKey   string
	Filename    string
	FileSize    int64
	ContentType string
	CreatedAt   time.Time
}
