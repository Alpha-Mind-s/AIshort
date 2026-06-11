package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/content-svc/internal/model"
    "github.com/ai-shot/content-svc/internal/repository"
)

type DramaHandler struct {
    repo *repository.DramaRepository
}

func NewDramaHandler(repo *repository.DramaRepository) *DramaHandler {
    return &DramaHandler{repo: repo}
}

func (h *DramaHandler) List(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
    page, pageSize = response.NormalizePage(page, pageSize)
    sort := c.DefaultQuery("sort", "latest")
    keyword := c.Query("keyword")

    var categoryID *int
    if cid := c.Query("category_id"); cid != "" {
        if id, err := strconv.Atoi(cid); err == nil {
            categoryID = &id
        }
    }

    dramas, total, err := h.repo.FindAll(c.Request.Context(), categoryID, sort, keyword, page, pageSize)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.Page(c, dramas, response.Meta{
        Page:     page,
        PageSize: pageSize,
        Total:    total,
    })
}

func (h *DramaHandler) Detail(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    drama, err := h.repo.FindByID(c.Request.Context(), id)
    if err != nil {
        response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, pkgErr.ErrNotFound.Message)
        return
    }

    response.OK(c, drama)
}

func (h *DramaHandler) Create(c *gin.Context) {
    var req model.CreateDramaRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
        return
    }

    creatorIDStr := c.GetHeader("X-User-ID")
    creatorID, err := strconv.ParseInt(creatorIDStr, 10, 64)
    if err != nil {
        response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, "missing user identity")
        return
    }

    role := c.GetHeader("X-User-Role")
    if role != "admin" && role != "creator" {
        response.Error(c, http.StatusForbidden, pkgErr.ErrForbidden.Code, "only admin or creator can create dramas")
        return
    }

    drama, err := h.repo.Create(c.Request.Context(), &req, creatorID)
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.Created(c, drama)
}

func (h *DramaHandler) Update(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    var req model.UpdateDramaRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
        return
    }

    drama, err := h.repo.Update(c.Request.Context(), id, &req)
    if err != nil {
        response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "drama not found")
        return
    }

    response.OK(c, drama)
}

func (h *DramaHandler) Delete(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    if err := h.repo.Delete(c.Request.Context(), id); err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.OK(c, nil)
}

func (h *DramaHandler) UpdateStatus(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, "invalid drama id")
        return
    }

    role := c.GetHeader("X-User-Role")
    if role != "admin" {
        response.Error(c, http.StatusForbidden, pkgErr.ErrForbidden.Code, "only admin can update drama status")
        return
    }

    var req model.UpdateStatusRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, pkgErr.ErrBadRequest.Code, pkgErr.ErrBadRequest.Message)
        return
    }

    drama, err := h.repo.UpdateStatus(c.Request.Context(), id, req.Status)
    if err != nil {
        response.Error(c, http.StatusNotFound, pkgErr.ErrNotFound.Code, "drama not found")
        return
    }

    response.OK(c, drama)
}
