package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/logger"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/content-svc/internal/model"
    "github.com/ai-shot/content-svc/internal/repository"
)

type EpisodeHandler struct {
    repo *repository.EpisodeRepository
}

func NewEpisodeHandler(repo *repository.EpisodeRepository) *EpisodeHandler {
    return &EpisodeHandler{repo: repo}
}

func (h *EpisodeHandler) ListByDrama(c *gin.Context) {
    dramaID, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    episodes, err := h.repo.FindByDrama(c.Request.Context(), dramaID)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.OK(c, episodes)
}

func (h *EpisodeHandler) Detail(c *gin.Context) {
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

    localizations, _ := h.repo.FindLocalizations(c.Request.Context(), id)
    episode.Localizations = localizations

    response.OK(c, episode)
}

func (h *EpisodeHandler) Create(c *gin.Context) {
	dramaID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
		return
	}

	role := c.GetHeader("X-User-Role")
	if role != "admin" && role != "creator" {
		response.Error(c, http.StatusForbidden, pkgErr.ErrForbidden.Code, "only admin or creator can add episodes")
		return
	}

	var req model.CreateEpisodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	episode, err := h.repo.Create(c.Request.Context(), dramaID, &req)
	if err != nil {
		logger.Error().Err(err).Int64("drama_id", dramaID).Int("episode_no", req.EpisodeNo).Msg("failed to create episode")
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.Created(c, episode)
}

func (h *EpisodeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	var req model.UpdateEpisodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	episode, err := h.repo.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "episode not found")
		return
	}

	response.OK(c, episode)
}

func (h *EpisodeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, nil)
}
