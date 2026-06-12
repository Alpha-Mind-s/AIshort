package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/pkg/response"
)

// RecordView handles POST /api/v1/episodes/:id/view
// Deduplication relies on the gateway's rate limiter (60 req/min per IP).
// A Redis-backed 24h dedup window can be added later as an optimization.
func (h *EpisodeHandler) RecordView(c *gin.Context) {
	episodeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	// Increment both episode and drama view_count in a single DB transaction
	dramaID, err := h.repo.IncrementViewCount(c.Request.Context(), episodeID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, "failed to record view")
		return
	}

	response.OK(c, gin.H{
		"recorded":   true,
		"episode_id": episodeID,
		"drama_id":   dramaID,
	})
}
