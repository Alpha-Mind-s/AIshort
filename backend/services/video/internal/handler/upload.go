package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/pkg/response"
	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/video-svc/internal/model"
	svc "github.com/ai-shot/video-svc/internal/service"
)

type UploadHandler struct {
	svc  *svc.UploadService
	repo *svc.UploadRepo
}

func NewUploadHandler(svc *svc.UploadService, repo *svc.UploadRepo) *UploadHandler {
	return &UploadHandler{svc: svc, repo: repo}
}

func (h *UploadHandler) GetUploadURL(c *gin.Context) {
	var req model.UploadURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	resp, err := h.svc.GetUploadURL(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, resp)
}

func (h *UploadHandler) InitMultipart(c *gin.Context) {
	var req model.MultipartInitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	resp, err := h.svc.InitMultipart(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, resp)
}

func (h *UploadHandler) CompleteMultipart(c *gin.Context) {
	var req model.MultipartCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	if err := h.svc.CompleteMultipart(c.Request.Context(), &req); err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, nil)
}

func (h *UploadHandler) CompleteUpload(c *gin.Context) {
	var req model.UploadCompleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	resp, err := h.svc.CompleteUpload(c.Request.Context(), h.repo, &req)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, resp)
}

// GetTasks returns AI processing tasks for a given episode/video ID.
func (h *UploadHandler) GetTasks(c *gin.Context) {
	episodeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid episode id")
		return
	}

	tasks, err := h.repo.GetTasks(c.Request.Context(), episodeID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, tasks)
}
