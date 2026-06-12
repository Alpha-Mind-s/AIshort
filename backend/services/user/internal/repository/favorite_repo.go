package repository

import (
    "context"
    "encoding/json"

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
    rows, err := r.pool.Query(ctx, `
        SELECT f.id, f.user_id, f.drama_id, f.created_at,
               d.id, d.title, COALESCE(d.cover_url,''), COALESCE(d.description,''), d.total_episodes,
               COALESCE(d.tags, '[]'::jsonb)
        FROM favorites f
        LEFT JOIN dramas d ON d.id = f.drama_id
        WHERE f.user_id=$1
        ORDER BY f.created_at DESC LIMIT $2 OFFSET $3`,
        userID, pageSize, offset)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    var favorites []*model.Favorite
    for rows.Next() {
        f := &model.Favorite{}
        f.Drama = &model.DramaSummary{}
        var tags []byte
        if err := rows.Scan(
            &f.ID, &f.UserID, &f.DramaID, &f.CreatedAt,
            &f.Drama.ID, &f.Drama.Title, &f.Drama.CoverURL, &f.Drama.Description, &f.Drama.TotalEpisodes,
            &tags,
        ); err != nil {
            return nil, 0, err
        }
        json.Unmarshal(tags, &f.Drama.Tags)
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
