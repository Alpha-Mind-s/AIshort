package repository

import (
    "context"
    "fmt"
    "strings"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ai-shot/content-svc/internal/model"
)

type EpisodeRepository struct {
    pool *pgxpool.Pool
}

func NewEpisodeRepository(pool *pgxpool.Pool) *EpisodeRepository {
    return &EpisodeRepository{pool: pool}
}

func (r *EpisodeRepository) FindByDrama(ctx context.Context, dramaID int64) ([]*model.Episode, error) {
    rows, err := r.pool.Query(ctx, `
        SELECT id, drama_id, episode_no, title, duration, video_url, status, created_at, updated_at
        FROM episodes WHERE drama_id=$1 AND status IN ('ready','processing') ORDER BY episode_no ASC`, dramaID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var episodes []*model.Episode
    for rows.Next() {
        e := &model.Episode{}
        if err := rows.Scan(&e.ID, &e.DramaID, &e.EpisodeNo, &e.Title, &e.Duration,
            &e.VideoURL, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
            return nil, err
        }
        episodes = append(episodes, e)
    }
    return episodes, nil
}

func (r *EpisodeRepository) FindByID(ctx context.Context, id int64) (*model.Episode, error) {
    e := &model.Episode{}
    err := r.pool.QueryRow(ctx, `
        SELECT id, drama_id, episode_no, title, duration, video_url, status, created_at, updated_at
        FROM episodes WHERE id=$1`, id).Scan(
        &e.ID, &e.DramaID, &e.EpisodeNo, &e.Title, &e.Duration,
        &e.VideoURL, &e.Status, &e.CreatedAt, &e.UpdatedAt)
    if err != nil {
        return nil, err
    }
    return e, nil
}

func (r *EpisodeRepository) FindLocalizations(ctx context.Context, episodeID int64) ([]*model.Localization, error) {
    rows, err := r.pool.Query(ctx, `
        SELECT id, episode_id, language, title_translated, dub_url, subtitle_url, lip_sync_url, status
        FROM localizations WHERE episode_id=$1`, episodeID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var localizations []*model.Localization
    for rows.Next() {
        l := &model.Localization{}
        if err := rows.Scan(&l.ID, &l.EpisodeID, &l.Language, &l.TitleTranslated,
            &l.DubURL, &l.SubtitleURL, &l.LipSyncURL, &l.Status); err != nil {
            return nil, err
        }
        localizations = append(localizations, l)
    }
    return localizations, nil
}

func (r *EpisodeRepository) Create(ctx context.Context, dramaID int64, req *model.CreateEpisodeRequest) (*model.Episode, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	e := &model.Episode{}
	err = tx.QueryRow(ctx, `
		INSERT INTO episodes (drama_id, episode_no, title, duration, video_url, status)
		VALUES ($1, $2, $3, $4, $5, 'processing')
		RETURNING id, drama_id, episode_no, title, duration, video_url, status, created_at, updated_at`,
		dramaID, req.EpisodeNo, req.Title, req.Duration, req.VideoURL).
		Scan(&e.ID, &e.DramaID, &e.EpisodeNo, &e.Title, &e.Duration,
			&e.VideoURL, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `UPDATE dramas SET total_episodes=total_episodes+1 WHERE id=$1`, dramaID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return e, nil
}

func (r *EpisodeRepository) Update(ctx context.Context, id int64, req *model.UpdateEpisodeRequest) (*model.Episode, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Title != nil {
		sets = append(sets, fmt.Sprintf("title=$%d", argIdx))
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Duration != nil {
		sets = append(sets, fmt.Sprintf("duration=$%d", argIdx))
		args = append(args, *req.Duration)
		argIdx++
	}
	if req.VideoURL != nil {
		sets = append(sets, fmt.Sprintf("video_url=$%d", argIdx))
		args = append(args, *req.VideoURL)
		argIdx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status=$%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.EpisodeNo != nil {
		sets = append(sets, fmt.Sprintf("episode_no=$%d", argIdx))
		args = append(args, *req.EpisodeNo)
		argIdx++
	}

	if len(sets) == 0 {
		return r.FindByID(ctx, id)
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE episodes SET %s, updated_at=NOW()
		WHERE id=$%d
		RETURNING id, drama_id, episode_no, title, duration, video_url, status, created_at, updated_at`,
		strings.Join(sets, ", "), argIdx)

	e := &model.Episode{}
	err := r.pool.QueryRow(ctx, query, args...).Scan(
		&e.ID, &e.DramaID, &e.EpisodeNo, &e.Title, &e.Duration,
		&e.VideoURL, &e.Status, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *EpisodeRepository) Delete(ctx context.Context, id int64) error {
	var dramaID int64
	err := r.pool.QueryRow(ctx, `SELECT drama_id FROM episodes WHERE id=$1`, id).Scan(&dramaID)
	if err != nil {
		return err
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `UPDATE episodes SET status='failed', updated_at=NOW() WHERE id=$1`, id)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `UPDATE dramas SET total_episodes=GREATEST(total_episodes-1, 0) WHERE id=$1`, dramaID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}
