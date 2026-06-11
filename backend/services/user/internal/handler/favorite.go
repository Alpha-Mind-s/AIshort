package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"

    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/user-svc/internal/model"
    svc "github.com/ai-shot/user-svc/internal/service"
)

type FavoriteHandler struct {
    svc *svc.FavoriteService
}

func NewFavoriteHandler(svc *svc.FavoriteService) *FavoriteHandler {
    return &FavoriteHandler{svc: svc}
}

func (h *FavoriteHandler) Add(c *gin.Context) {
    var req model.AddFavoriteRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
        return
    }

    userID := c.GetInt64("user_id")
    if err := h.svc.Add(c.Request.Context(), userID, req.DramaID); err != nil {
        if appErr := pkgErr.AsAppError(err); appErr != nil {
            response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
        } else {
            response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        }
        return
    }

    response.Created(c, nil)
}

func (h *FavoriteHandler) List(c *gin.Context) {
    userID := c.GetInt64("user_id")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
    page, pageSize = response.NormalizePage(page, pageSize)

    favorites, total, err := h.svc.List(c.Request.Context(), userID, page, pageSize)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.Page(c, favorites, response.Meta{
        Page:     page,
        PageSize: pageSize,
        Total:    total,
    })
}

func (h *FavoriteHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid favorite id")
        return
    }

    userID := c.GetInt64("user_id")
    if err := h.svc.Remove(c.Request.Context(), id, userID); err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    c.Status(http.StatusNoContent)
}
