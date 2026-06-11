package repository

import (
    "context"

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
        FROM episodes WHERE drama_id=$1 AND status='ready' ORDER BY episode_no ASC`, dramaID)
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
