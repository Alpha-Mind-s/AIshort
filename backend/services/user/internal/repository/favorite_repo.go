package repository

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ai-shot/user-svc/internal/model"
)

type FavoriteRepository struct {
    pool *pgxpool.Pool
}

func NewFavoriteRepository(pool *pgxpool.Pool) *FavoriteRepository {
    return &FavoriteRepository{pool: pool}
}

func (r *FavoriteRepository) Create(ctx context.Context, userID, dramaID int64) error {
    _, err := r.pool.Exec(ctx, "INSERT INTO favorites (user_id, drama_id, created_at) VALUES ($1, $2, NOW())", userID, dramaID)
    return err
}

func (r *FavoriteRepository) Delete(ctx context.Context, id, userID int64) error {
    _, err := r.pool.Exec(ctx, "DELETE FROM favorites WHERE id=$1 AND user_id=$2", id, userID)
    return err
}

func (r *FavoriteRepository) FindByUser(ctx context.Context, userID int64, page, pageSize int) ([]*model.Favorite, int, error) {
    var total int
    err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM favorites WHERE user_id=$1", userID).Scan(&total)
    if err != nil {
        return nil, 0, err
    }

    offset := (page - 1) * pageSize
    rows, err := r.pool.Query(ctx,
        "SELECT id, user_id, drama_id, created_at FROM favorites WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        userID, pageSize, offset)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    var favorites []*model.Favorite
    for rows.Next() {
        f := &model.Favorite{}
        if err := rows.Scan(&f.ID, &f.UserID, &f.DramaID, &f.CreatedAt); err != nil {
            return nil, 0, err
        }
        favorites = append(favorites, f)
    }
    return favorites, total, nil
}

func (r *FavoriteRepository) FindByUserAndDrama(ctx context.Context, userID, dramaID int64) (*model.Favorite, error) {
    f := &model.Favorite{}
    err := r.pool.QueryRow(ctx, "SELECT id, user_id, drama_id, created_at FROM favorites WHERE user_id=$1 AND drama_id=$2",
        userID, dramaID).Scan(&f.ID, &f.UserID, &f.DramaID, &f.CreatedAt)
    if err != nil {
        return nil, err
    }
    return f, nil
}
