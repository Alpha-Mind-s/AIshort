package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ai-shot/content-svc/internal/model"
)

type DramaRepository struct {
	pool *pgxpool.Pool
}

func NewDramaRepository(pool *pgxpool.Pool) *DramaRepository {
	return &DramaRepository{pool: pool}
}

func validDramaSortOrder(sort string) string {
	switch sort {
	case "popular":
		return "d.view_count DESC, d.id DESC"
	case "trending":
		return "d.release_at DESC NULLS LAST"
	default:
		return "d.release_at DESC NULLS LAST"
	}
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

	orderBy := validDramaSortOrder(sort)

	offset := (page - 1) * pageSize
	query := fmt.Sprintf(`
		SELECT d.id, d.title, d.description, d.cover_url, d.category_id, d.creator_id,
		       d.total_episodes, d.status, d.tags, d.release_at, d.created_at, d.updated_at,
		       COALESCE(d.view_count, 0)
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
			&d.CreatorID, &d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt,
			&d.ViewCount); err != nil {
			return nil, 0, err
		}
		dramas = append(dramas, d)
	}
	return dramas, total, nil
}

func (r *DramaRepository) FindByID(ctx context.Context, id int64) (*model.Drama, error) {
	d := &model.Drama{}
	err := r.pool.QueryRow(ctx, `
		SELECT id, title, description, cover_url, category_id, creator_id,
		       total_episodes, status, tags, release_at, created_at, updated_at,
		       COALESCE(view_count, 0)
		FROM dramas WHERE id=$1`, id).Scan(
		&d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID,
		&d.CreatorID, &d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt,
		&d.ViewCount)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *DramaRepository) Create(ctx context.Context, req *model.CreateDramaRequest, creatorID int64) (*model.Drama, error) {
	status := req.Status
	if status == "" {
		status = "draft"
	}
	d := &model.Drama{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO dramas (title, description, cover_url, category_id, creator_id, tags, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, description, cover_url, category_id, creator_id,
		          total_episodes, status, tags, release_at, created_at, updated_at,
		          COALESCE(view_count, 0)`,
		req.Title, req.Description, req.CoverURL, req.CategoryID, creatorID, req.Tags, status).
		Scan(&d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID, &d.CreatorID,
			&d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt,
			&d.ViewCount)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *DramaRepository) Update(ctx context.Context, id int64, req *model.UpdateDramaRequest) (*model.Drama, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Title != nil {
		sets = append(sets, fmt.Sprintf("title=$%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description=$%d", argIdx))
		args = append(args, *req.Description)
		argIdx++
	}
	if req.CoverURL != nil {
		sets = append(sets, fmt.Sprintf("cover_url=$%d", argIdx))
		args = append(args, *req.CoverURL)
		argIdx++
	}
	if req.CategoryID != nil {
		sets = append(sets, fmt.Sprintf("category_id=$%d", argIdx))
		args = append(args, *req.CategoryID)
		argIdx++
	}
	if req.Tags != nil {
		sets = append(sets, fmt.Sprintf("tags=$%d", argIdx))
		args = append(args, req.Tags)
		argIdx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status=$%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(sets) == 0 {
		return r.FindByID(ctx, id)
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE dramas SET %s, updated_at=NOW()
		WHERE id=$%d
		RETURNING id, title, description, cover_url, category_id, creator_id,
		          total_episodes, status, tags, release_at, created_at, updated_at,
		          COALESCE(view_count, 0)`,
		strings.Join(sets, ", "), argIdx)

	d := &model.Drama{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID, &d.CreatorID,
		&d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt,
		&d.ViewCount)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (r *DramaRepository) Delete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE dramas SET status='archived', updated_at=NOW() WHERE id=$1`, id)
	return err
}

func (r *DramaRepository) UpdateStatus(ctx context.Context, id int64, status string) (*model.Drama, error) {
	d := &model.Drama{}
	err := r.pool.QueryRow(ctx, `
		UPDATE dramas SET status=$1, updated_at=NOW()
		WHERE id=$2
		RETURNING id, title, description, cover_url, category_id, creator_id,
		          total_episodes, status, tags, release_at, created_at, updated_at,
		          COALESCE(view_count, 0)`,
		status, id).
		Scan(&d.ID, &d.Title, &d.Description, &d.CoverURL, &d.CategoryID, &d.CreatorID,
			&d.TotalEpisodes, &d.Status, &d.Tags, &d.ReleaseAt, &d.CreatedAt, &d.UpdatedAt,
			&d.ViewCount)
	if err != nil {
		return nil, err
	}
	return d, nil
}
