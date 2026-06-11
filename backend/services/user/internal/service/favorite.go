package service

import (
    "context"

    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/user-svc/internal/model"
    "github.com/ai-shot/user-svc/internal/repository"
)

type FavoriteService struct {
    repo *repository.FavoriteRepository
}

func NewFavoriteService(repo *repository.FavoriteRepository) *FavoriteService {
    return &FavoriteService{repo: repo}
}

func (s *FavoriteService) Add(ctx context.Context, userID, dramaID int64) error {
    existing, _ := s.repo.FindByUserAndDrama(ctx, userID, dramaID)
    if existing != nil {
        return pkgErr.ErrFavoriteExists
    }
    return s.repo.Create(ctx, userID, dramaID)
}

func (s *FavoriteService) Remove(ctx context.Context, id, userID int64) error {
    return s.repo.Delete(ctx, id, userID)
}

func (s *FavoriteService) List(ctx context.Context, userID int64, page, pageSize int) ([]*model.Favorite, int, error) {
    return s.repo.FindByUser(ctx, userID, page, pageSize)
}
