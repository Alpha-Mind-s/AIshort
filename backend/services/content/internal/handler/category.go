package handler

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/content-svc/internal/repository"
)

type CategoryHandler struct {
    repo *repository.CategoryRepository
}

func NewCategoryHandler(repo *repository.CategoryRepository) *CategoryHandler {
    return &CategoryHandler{repo: repo}
}

func (h *CategoryHandler) List(c *gin.Context) {
    categories, err := h.repo.FindAll(c.Request.Context())
    if err != nil {
        response.Error(c, http.StatusInternalServerError, pkgErr.ErrInternal.Code, pkgErr.ErrInternal.Message)
        return
    }

    response.OK(c, categories)
}
