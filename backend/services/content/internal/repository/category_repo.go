package repository

import (
    "context"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ai-shot/content-svc/internal/model"
)

type CategoryRepository struct {
    pool *pgxpool.Pool
}

func NewCategoryRepository(pool *pgxpool.Pool) *CategoryRepository {
    return &CategoryRepository{pool: pool}
}

func (r *CategoryRepository) FindAll(ctx context.Context) ([]*model.Category, error) {
    rows, err := r.pool.Query(ctx, "SELECT id, name, slug, parent_id, sort_order, created_at FROM categories ORDER BY sort_order ASC")
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var categories []*model.Category
    for rows.Next() {
        c := &model.Category{}
        if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.ParentID, &c.SortOrder, &c.CreatedAt); err != nil {
            return nil, err
        }
        categories = append(categories, c)
    }
    return categories, nil
}
