package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/pkg/response"
	"github.com/ai-shot/user-svc/internal/repository"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

// GetProfile returns the authenticated user's profile.
// Expects X-User-ID header set by the gateway's ForwardUserContext middleware.
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := parseUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
		return
	}

	user, err := h.repo.FindByID(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, pkgErr.ErrNotFound.Message)
		return
	}

	response.OK(c, user)
}

// UpdateProfileRequest is the body for PUT /users/me.
type UpdateProfileRequest struct {
	Nickname  *string `json:"nickname" binding:"omitempty,min=1,max=100"`
	AvatarURL *string `json:"avatar_url"`
	Language  *string `json:"language"`
	Region    *string `json:"region"`
}

// UpdateProfile updates the authenticated user's profile fields.
// Expects X-User-ID header set by the gateway's ForwardUserContext middleware.
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := parseUserID(c)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	user, err := h.repo.FindByID(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, pkgErr.ErrNotFound.Message)
		return
	}

	if req.Nickname != nil {
		user.Nickname = *req.Nickname
	}
	if req.AvatarURL != nil {
		user.AvatarURL = *req.AvatarURL
	}
	if req.Language != nil {
		user.Language = *req.Language
	}
	if req.Region != nil {
		user.Region = *req.Region
	}

	if err := h.repo.UpdateProfile(c.Request.Context(), user); err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, user)
}

// parseUserID reads the X-User-ID header set by the gateway and parses it as int64.
func parseUserID(c *gin.Context) (int64, error) {
	userIDStr := c.GetHeader("X-User-ID")
	if userIDStr == "" {
		return 0, strconv.ErrSyntax
	}
	return strconv.ParseInt(userIDStr, 10, 64)
}
