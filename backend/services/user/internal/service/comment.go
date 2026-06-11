package service

import (
    "context"

    pkgErr "github.com/ai-shot/pkg/errors"
    "github.com/ai-shot/user-svc/internal/model"
    "github.com/ai-shot/user-svc/internal/repository"
)

type CommentService struct {
    repo     *repository.CommentRepository
    userRepo *repository.UserRepository
}

func NewCommentService(repo *repository.CommentRepository, userRepo *repository.UserRepository) *CommentService {
    return &CommentService{repo: repo, userRepo: userRepo}
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
    // Populate the user field from the database
    user, err := s.userRepo.FindByID(ctx, userID)
    if err == nil {
        comment.User = user
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

// LikeResult is returned after toggling a like.
type LikeResult struct {
    CommentID  int64 `json:"comment_id"`
    IsLiked    bool  `json:"is_liked"`
    LikesCount int   `json:"likes_count"`
}

// ToggleLike toggles a like on a comment and returns the new state.
func (s *CommentService) ToggleLike(ctx context.Context, userID, commentID int64) (*LikeResult, error) {
    // Ensure comment exists
    _, err := s.repo.FindByID(ctx, commentID)
    if err != nil {
        return nil, pkgErr.ErrNotFound
    }

    isLiked, likesCount, err := s.repo.ToggleLike(ctx, userID, commentID)
    if err != nil {
        return nil, err
    }

    return &LikeResult{
        CommentID:  commentID,
        IsLiked:    isLiked,
        LikesCount: likesCount,
    }, nil
}
