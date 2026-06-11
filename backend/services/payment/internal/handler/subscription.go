package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ai-shot/pkg/response"
	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/payment-svc/internal/model"
	svc "github.com/ai-shot/payment-svc/internal/service"
)

type SubscriptionHandler struct {
	svc *svc.SubscriptionService
}

func NewSubscriptionHandler(svc *svc.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{svc: svc}
}

func (h *SubscriptionHandler) GetPlans(c *gin.Context) {
	plans := h.svc.GetPlans()
	response.OK(c, plans)
}

func (h *SubscriptionHandler) Create(c *gin.Context) {
	var req model.CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
		return
	}

	userID := c.GetInt64("user_id")
	resp, err := h.svc.Create(c.Request.Context(), userID, &req)
	if err != nil {
		appErr, ok := err.(*pkgErr.AppError)
		if ok {
			response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
		} else {
			response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		}
		return
	}

	response.OK(c, resp)
}

func (h *SubscriptionHandler) Cancel(c *gin.Context) {
	userID := c.GetInt64("user_id")
	if err := h.svc.Cancel(c.Request.Context(), userID); err != nil {
		response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
		return
	}

	response.OK(c, nil)
}

func (h *SubscriptionHandler) Status(c *gin.Context) {
	userID := c.GetInt64("user_id")
	sub, err := h.svc.Status(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "no active subscription")
		return
	}

	response.OK(c, sub)
}
