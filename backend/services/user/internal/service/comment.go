package service

import (
    "context"

    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/user-svc/internal/model"
    "github.com/ai-shot/user-svc/internal/repository"
)

type CommentService struct {
    repo *repository.CommentRepository
}

func NewCommentService(repo *repository.CommentRepository) *CommentService {
    return &CommentService{repo: repo}
}

func (s *CommentService) Create(ctx context.Context, userID, dramaID int64, req *model.CreateCommentRequest) (*model.Comment, error) {
    comment := &model.Comment{
        UserID:   userID,
        DramaID:  dramaID,
        ParentID: req.ParentID,
        Content:  req.Content,
    }
    if err := s.repo.Create(ctx, comment); err != nil {
        return nil, err
    }
    return comment, nil
}

func (s *CommentService) List(ctx context.Context, dramaID int64, sort string, page, pageSize int) ([]*model.Comment, int, error) {
    return s.repo.FindByDrama(ctx, dramaID, sort, page, pageSize)
}

func (s *CommentService) Delete(ctx context.Context, commentID, userID int64) error {
    c, err := s.repo.FindByID(ctx, commentID)
    if err != nil {
        return pkgErr.ErrNotFound
    }
    if c.UserID != userID {
        return pkgErr.ErrCommentForbidden
    }
    return s.repo.Delete(ctx, commentID, userID)
}
