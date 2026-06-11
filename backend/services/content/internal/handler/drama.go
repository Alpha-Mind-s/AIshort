package handler

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
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
