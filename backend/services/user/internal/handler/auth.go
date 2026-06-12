package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/pkg/response"
	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/user-svc/internal/model"
	svc "github.com/ai-shot/user-svc/internal/service"
)

type AuthHandler struct {
	authSvc *svc.AuthService
}

func NewAuthHandler(authSvc *svc.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	tokens, err := h.authSvc.Register(c.Request.Context(), &req)
	if err != nil {
		if appErr := pkgErr.AsAppError(err); appErr != nil {
			response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
		} else {
			response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		}
		return
	}

	response.Created(c, tokens)
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	tokens, err := h.authSvc.Login(c.Request.Context(), &req)
	if err != nil {
		if appErr := pkgErr.AsAppError(err); appErr != nil {
			response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
		} else {
			response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		}
		return
	}

	response.OK(c, tokens)
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req model.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	// The refresh token itself identifies the user — no need for a separate user_id.
	tokens, err := h.authSvc.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if appErr := pkgErr.AsAppError(err); appErr != nil {
			response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
		} else {
			response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		}
		return
	}

	response.OK(c, tokens)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	accessToken := c.GetString("access_token")
	userID := c.GetInt64("user_id")

	if err := h.authSvc.Logout(c.Request.Context(), accessToken, userID); err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, nil)
}
