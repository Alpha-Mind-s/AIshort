package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
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
