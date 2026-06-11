package model

import "time"

type Episode struct {
    ID            int64          `json:"id"`
    DramaID       int64          `json:"drama_id"`
    EpisodeNo     int            `json:"episode_no"`
    Title         string         `json:"title"`
    Duration      *int           `json:"duration"`
    VideoURL      string         `json:"video_url"`
    Status        string         `json:"status"`
    CreatedAt     time.Time      `json:"created_at"`
    UpdatedAt     time.Time      `json:"updated_at"`
    Localizations []*Localization `json:"localizations,omitempty"`
}

type Localization struct {
    ID              int64  `json:"id"`
    EpisodeID       int64  `json:"episode_id"`
    Language        string `json:"language"`
    TitleTranslated string `json:"title_translated"`
    DubURL          string `json:"dub_url"`
    SubtitleURL     string `json:"subtitle_url"`
    LipSyncURL      string `json:"lip_sync_url"`
    Status          string `json:"status"`
}

type EpisodePlayInfo struct {
    Episode   *Episode       `json:"episode"`
    PlayURL   string         `json:"play_url"`
    ExpiresAt time.Time      `json:"expires_at"`
    Qualities []*VideoQuality `json:"qualities"`
}

type VideoQuality struct {
    Resolution string `json:"resolution"`
    URL        string `json:"url"`
    Bitrate    int    `json:"bitrate"`
}
