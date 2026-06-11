package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/content-svc/internal/model"
	"github.com/ai-shot/content-svc/internal/repository"
	"github.com/ai-shot/pkg/response"
	pkgErr "github.com/ai-shot/pkg/errors"
)

type InternalHandler struct {
	episodeRepo *repository.EpisodeRepository
	repo        *repository.InternalRepository
}

func NewInternalHandler(episodeRepo *repository.EpisodeRepository, repo *repository.InternalRepository) *InternalHandler {
	return &InternalHandler{episodeRepo: episodeRepo, repo: repo}
}

func (h *InternalHandler) ListJobs(c *gin.Context) {
	statusStr := c.Query("status")
	jobType := c.Query("job_type")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	var statuses []string
	if statusStr != "" {
		for _, s := range strings.Split(statusStr, ",") {
			statuses = append(statuses, strings.TrimSpace(s))
		}
	}

	jobs, err := h.repo.ListJobs(c.Request.Context(), statuses, jobType, limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, jobs)
}

func (h *InternalHandler) UpdateJobStatus(c *gin.Context) {
	jobID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid job id")
		return
	}

	var req model.AIJobStatusUpdate
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	job, err := h.repo.UpdateJobStatus(c.Request.Context(), jobID, &req)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "job not found")
		return
	}

	response.OK(c, job)
}

func (h *InternalHandler) GetEpisode(c *gin.Context) {
	episodeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	episode, err := h.episodeRepo.FindByID(c.Request.Context(), episodeID)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "episode not found")
		return
	}

	localizations, _ := h.episodeRepo.FindLocalizations(c.Request.Context(), episodeID)
	episode.Localizations = localizations

	response.OK(c, episode)
}

func (h *InternalHandler) UpsertLocalization(c *gin.Context) {
	episodeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	var req model.LocalizationUpsert
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	loc, err := h.repo.UpsertLocalization(c.Request.Context(), episodeID, &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, loc)
}
