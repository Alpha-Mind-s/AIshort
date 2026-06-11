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

func validSortOrder(sort string, allowed map[string]string) string {
    if order, ok := allowed[sort]; ok {
        return order
    }
    return allowed["latest"]
}

func (r *CommentRepository) FindByDrama(ctx context.Context, dramaID int64, sort string, page, pageSize int) ([]*model.Comment, int, error) {
    var total int
    r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM comments WHERE drama_id=$1 AND status='active'", dramaID).Scan(&total)

    offset := (page - 1) * pageSize
    orderBy := validSortOrder(sort, map[string]string{
        "latest": "c.created_at DESC",
        "hottest": "c.likes_count DESC, c.created_at DESC",
    })

    query := `SELECT c.id, c.user_id, c.drama_id, c.parent_id, c.content, c.likes_count, c.created_at, c.updated_at,
                     u.id, u.email, u.nickname, COALESCE(u.avatar_url, ''), u.password_hash, u.role, COALESCE(u.language, ''), COALESCE(u.region, ''), u.created_at
              FROM comments c
              LEFT JOIN users u ON c.user_id = u.id
              WHERE c.drama_id=$1 AND c.status='active'
              ORDER BY ` + orderBy + ` LIMIT $2 OFFSET $3`
    rows, err := r.pool.Query(ctx, query, dramaID, pageSize, offset)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    var comments []*model.Comment
    for rows.Next() {
        c := &model.Comment{}
        u := &model.User{}
        if err := rows.Scan(
            &c.ID, &c.UserID, &c.DramaID, &c.ParentID, &c.Content, &c.LikesCount, &c.CreatedAt, &c.UpdatedAt,
            &u.ID, &u.Email, &u.Nickname, &u.AvatarURL, &u.PasswordHash, &u.Role, &u.Language, &u.Region, &u.CreatedAt,
        ); err != nil {
            return nil, 0, err
        }
        c.User = u
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

// ToggleLike adds or removes a like for a user on a comment.
// Returns (isLiked, likesCount, error).
func (r *CommentRepository) ToggleLike(ctx context.Context, userID, commentID int64) (bool, int, error) {
    // Check if already liked
    var exists bool
    err := r.pool.QueryRow(ctx,
        "SELECT EXISTS(SELECT 1 FROM comment_likes WHERE user_id=$1 AND comment_id=$2)",
        userID, commentID).Scan(&exists)
    if err != nil {
        return false, 0, err
    }

    if exists {
        // Unlike: remove the like row and decrement counter
        _, err = r.pool.Exec(ctx,
            "DELETE FROM comment_likes WHERE user_id=$1 AND comment_id=$2",
            userID, commentID)
        if err != nil {
            return false, 0, err
        }
        if err := r.DecrementLikes(ctx, commentID); err != nil {
            return false, 0, err
        }
    } else {
        // Like: insert the like row and increment counter
        _, err = r.pool.Exec(ctx,
            "INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)",
            userID, commentID)
        if err != nil {
            return false, 0, err
        }
        if err := r.IncrementLikes(ctx, commentID); err != nil {
            return false, 0, err
        }
    }

    // Read the updated likes_count
    var likesCount int
    err = r.pool.QueryRow(ctx,
        "SELECT likes_count FROM comments WHERE id=$1", commentID).Scan(&likesCount)
    if err != nil {
        return false, 0, err
    }

    return !exists, likesCount, nil
}
