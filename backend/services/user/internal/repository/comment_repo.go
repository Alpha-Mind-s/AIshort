package repository

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ai-shot/user-svc/internal/model"
)

type CommentRepository struct {
    pool *pgxpool.Pool
}

func NewCommentRepository(pool *pgxpool.Pool) *CommentRepository {
    return &CommentRepository{pool: pool}
}

func (r *CommentRepository) Create(ctx context.Context, comment *model.Comment) error {
    err := r.pool.QueryRow(ctx,
        `INSERT INTO comments (user_id, drama_id, parent_id, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        comment.UserID, comment.DramaID, comment.ParentID, comment.Content).Scan(&comment.ID)
    return err
}

func (r *CommentRepository) FindByDrama(ctx context.Context, dramaID int64, sort string, page, pageSize int) ([]*model.Comment, int, error) {
    var total int
    r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM comments WHERE drama_id=$1 AND status='active'", dramaID).Scan(&total)

    offset := (page - 1) * pageSize
    orderBy := "created_at DESC"
    if sort == "hottest" {
        orderBy = "likes_count DESC, created_at DESC"
    }

    query := `SELECT id, user_id, drama_id, parent_id, content, likes_count, created_at, updated_at
              FROM comments WHERE drama_id=$1 AND status='active' ORDER BY ` + orderBy + ` LIMIT $2 OFFSET $3`
    rows, err := r.pool.Query(ctx, query, dramaID, pageSize, offset)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    var comments []*model.Comment
    for rows.Next() {
        c := &model.Comment{}
        if err := rows.Scan(&c.ID, &c.UserID, &c.DramaID, &c.ParentID, &c.Content, &c.LikesCount, &c.CreatedAt, &c.UpdatedAt); err != nil {
            return nil, 0, err
        }
        comments = append(comments, c)
    }
    return comments, total, nil
}

func (r *CommentRepository) Delete(ctx context.Context, id, userID int64) error {
    _, err := r.pool.Exec(ctx, "UPDATE comments SET status='deleted', updated_at=NOW() WHERE id=$1 AND user_id=$2", id, userID)
    return err
}

func (r *CommentRepository) FindByID(ctx context.Context, id int64) (*model.Comment, error) {
    c := &model.Comment{}
    err := r.pool.QueryRow(ctx,
        "SELECT id, user_id, drama_id, parent_id, content, likes_count, status, created_at, updated_at FROM comments WHERE id=$1", id).
        Scan(&c.ID, &c.UserID, &c.DramaID, &c.ParentID, &c.Content, &c.LikesCount, &c.Status, &c.CreatedAt, &c.UpdatedAt)
    if err != nil {
        return nil, err
    }
    return c, nil
}

func (r *CommentRepository) IncrementLikes(ctx context.Context, id int64) error {
    _, err := r.pool.Exec(ctx, "UPDATE comments SET likes_count=likes_count+1 WHERE id=$1", id)
    return err
}

func (r *CommentRepository) DecrementLikes(ctx context.Context, id int64) error {
    _, err := r.pool.Exec(ctx, "UPDATE comments SET likes_count=GREATEST(likes_count-1, 0) WHERE id=$1", id)
    return err
}
