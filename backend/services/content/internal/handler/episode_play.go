package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/content-svc/internal/model"
	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/pkg/response"
)

// Play returns signed playback URLs for an episode.
// In production this would generate presigned/CDN URLs with expiry.
// For dev MVP it returns the video_url directly.
func (h *EpisodeHandler) Play(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	episode, err := h.repo.FindByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, pkgErr.ErrNotFound.Message)
		return
	}

	// Dev: use video_url directly. Production would generate presigned URLs.
	playURL := episode.VideoURL
	expiresAt := time.Now().Add(24 * time.Hour)

	playInfo := &model.EpisodePlayInfo{
		Episode:   episode,
		PlayURL:   playURL,
		ExpiresAt: expiresAt,
		Qualities: []*model.VideoQuality{
			{Resolution: "720p", URL: playURL, Bitrate: 2000000},
		},
	}

	response.OK(c, playInfo)
}
