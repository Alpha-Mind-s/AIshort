package repository

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ai-shot/content-svc/internal/model"
)

type DramaRepository struct {
    pool *pgxpool.Pool
}

func NewDramaRepository(pool *pgxpool.Pool) *DramaRepository {
    return &DramaRepository{pool: pool}
}

func (r *DramaRepository) FindAll(ctx context.Context, categoryID *int, sort, keyword string, page, pageSize int) ([]*model.Drama, int, error) {
    where := "WHERE d.status='published'"
    args := []interface{}{}
    argIdx := 1

    if categoryID != nil {
        where += fmt.Sprintf(" AND d.category_id=$%d", argIdx)
        args = append(args, *categoryID)
        argIdx++
    }
    if keyword != "" {
        where += fmt.Sprintf(" AND (d.title ILIKE $%d OR d.description ILIKE $%d)", argIdx, argIdx+1)
        like := "%" + keyword + "%"
        args = append(args, like, like)
        argIdx += 2
    }

    var total int
    countQuery := "SELECT COUNT(*) FROM dramas d " + where
    r.pool.QueryRow(ctx, countQuery, args...).Scan(&total)

    orderBy := "d.release_at DESC NULLS LAST"
    switch sort {
    case "popular":
        orderBy = "d.id DESC"
    case "trending":
        orderBy = "d.release_at DESC NULLS LAST"
    }

    offset := (page - 1) * pageSize
    query := fmt.Sprintf(`
        SELECT d.id, d.title, d.description, d.cover_url, d.category_id, d.creator_id,
               d.total_episodes, d.status, d.tags, d.release_at, d.created_at, d.updated_at
        FROM dramas d %s ORDER BY %s LIMIT $%d OFFSET $%d`, where, orderBy, argIdx, argIdx+1)
    args = append(args, pageSize, offset)

    rows, err := r.pool.Query(ctx, query, args...)
    if err != nil {
        return nil, 0, err
    }
    defer rows.Close()

    var dramas []*model.Drama
    for rows.Next() {
        d := &model.Drama{}
        if err := rows.Scan(&d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID,
            &d.CreatorID, &d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
            return nil, 0, err
        }
        d.ViewCount = 0
        d.LikeCount = 0
        d.FavoriteCount = 0
        dramas = append(dramas, d)
    }
    return dramas, total, nil
}

func (r *DramaRepository) FindByID(ctx context.Context, id int64) (*model.Drama, error) {
    d := &model.Drama{}
    err := r.pool.QueryRow(ctx, `
        SELECT id, title, description, cover_url, category_id, creator_id,
               total_episodes, status, tags, release_at, created_at, updated_at
        FROM dramas WHERE id=$1`, id).Scan(
        &d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID,
        &d.CreatorID, &d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt)
    if err != nil {
        return nil, err
    }
    return d, nil
}
