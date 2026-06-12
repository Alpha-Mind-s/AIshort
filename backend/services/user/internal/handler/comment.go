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

type CommentHandler struct {
    svc *svc.CommentService
}

func NewCommentHandler(svc *svc.CommentService) *CommentHandler {
    return &CommentHandler{svc: svc}
}

func (h *CommentHandler) Create(c *gin.Context) {
    dramaID, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    var req model.CreateCommentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
        return
    }

    userID, err := parseUserID(c)
    if err != nil {
        response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
        return
    }

    comment, err := h.svc.Create(c.Request.Context(), userID, dramaID, &req)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.Created(c, comment)
}

func (h *CommentHandler) List(c *gin.Context) {
    dramaID, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    sort := c.DefaultQuery("sort", "latest")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
    page, pageSize = response.NormalizePage(page, pageSize)

    comments, total, err := h.svc.List(c.Request.Context(), dramaID, sort, page, pageSize)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.Page(c, comments, response.Meta{
        Page:     page,
        PageSize: pageSize,
        Total:    total,
    })
}

func (h *CommentHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid comment id")
        return
    }

    userID, err := parseUserID(c)
    if err != nil {
        response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
        return
    }

    if err := h.svc.Delete(c.Request.Context(), id, userID); err != nil {
        if appErr := pkgErr.AsAppError(err); appErr != nil {
            response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
        } else {
            response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        }
        return
    }

    response.OK(c, nil)
}

// Like toggles a like on a comment (like if not liked, unlike if already liked).
// Expects X-User-ID header set by the gateway's ForwardUserContext middleware.
func (h *CommentHandler) Like(c *gin.Context) {
    commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid comment id")
        return
    }

    userID, err := parseUserID(c)
    if err != nil {
        response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
        return
    }

    result, err := h.svc.ToggleLike(c.Request.Context(), userID, commentID)
    if err != nil {
        if appErr := pkgErr.AsAppError(err); appErr != nil {
            response.Error(c, appErr.HTTPStatus, appErr.Code, appErr.Message)
        } else {
            response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        }
        return
    }

    response.OK(c, result)
}
