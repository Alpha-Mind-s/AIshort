package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/pkg/response"
	pkgErr "github.com/ai-shot/pkg/errors"
	svc "github.com/ai-shot/user-svc/internal/service"
)

type OAuthHandler struct {
	authSvc *svc.AuthService
}

func NewOAuthHandler(authSvc *svc.AuthService) *OAuthHandler {
	return &OAuthHandler{authSvc: authSvc}
}

// Redirect builds and returns the OAuth provider's consent screen URL.
// The gateway proxies GET /api/v1/auth/oauth/:provider?redirect_uri=xxx here.
func (h *OAuthHandler) Redirect(c *gin.Context) {
	provider := c.Param("provider")
	redirectURI := c.Query("redirect_uri")
	if provider != "google" {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "only 'google' OAuth is supported")
		return
	}
	if redirectURI == "" {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "missing redirect_uri")
		return
	}
	authURL := svc.OAuthRedirectURL(redirectURI)
	response.OK(c, gin.H{"auth_url": authURL})
}

// Callback handles the OAuth redirect from Google etc.
// The gateway proxies POST /api/v1/auth/oauth/:provider/callback?code=xxx here.
func (h *OAuthHandler) Callback(c *gin.Context) {
	provider := c.Param("provider")
	code := c.Query("code")
	if code == "" {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "missing authorization code")
		return
	}

	redirectURI := c.Query("redirect_uri")
	if redirectURI == "" {
		redirectURI = "postmessage" // fallback for SPAs
	}

	tokens, err := h.authSvc.OAuthLogin(c.Request.Context(), provider, code, redirectURI)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, pkgErr.ErrOAuthFailed.Code, err.Error())
		return
	}

	response.OK(c, tokens)
}
