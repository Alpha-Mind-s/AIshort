package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ai-shot/content-svc/internal/model"
)

type InternalRepository struct {
	pool *pgxpool.Pool
}

func NewInternalRepository(pool *pgxpool.Pool) *InternalRepository {
	return &InternalRepository{pool: pool}
}

func (r *InternalRepository) ListJobs(ctx context.Context, statuses []string, jobType string, limit int) ([]*model.AIJob, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	args := []interface{}{}
	argIdx := 1

	whereClauses := []string{}
	if len(statuses) > 0 {
		placeholders := []string{}
		for _, s := range statuses {
			placeholders = append(placeholders, fmt.Sprintf("$%d", argIdx))
			args = append(args, strings.TrimSpace(s))
			argIdx++
		}
		whereClauses = append(whereClauses, fmt.Sprintf("status IN (%s)", strings.Join(placeholders, ",")))
	}
	if jobType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("job_type=$%d", argIdx))
		args = append(args, jobType)
		argIdx++
	}

	where := ""
	if len(whereClauses) > 0 {
		where = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	query := fmt.Sprintf(`
		SELECT id, episode_id, job_type, status, result_meta, error_message, retry_count, created_at
		FROM ai_jobs %s ORDER BY created_at ASC LIMIT $%d`, where, argIdx)
	args = append(args, limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []*model.AIJob
	for rows.Next() {
		j := &model.AIJob{}
		if err := rows.Scan(&j.ID, &j.EpisodeID, &j.JobType, &j.Status,
			&j.ResultMeta, &j.ErrorMessage, &j.RetryCount, &j.CreatedAt); err != nil {
			return nil, err
		}
		jobs = append(jobs, j)
	}
	return jobs, nil
}

func (r *InternalRepository) UpdateJobStatus(ctx context.Context, jobID int64, update *model.AIJobStatusUpdate) (*model.AIJob, error) {
	j := &model.AIJob{}
	err := r.pool.QueryRow(ctx, `
		UPDATE ai_jobs
		SET status=$1, result_meta=$2, error_message=$3, retry_count=retry_count+1, updated_at=NOW()
		WHERE id=$4
		RETURNING id, episode_id, job_type, status, result_meta, error_message, retry_count, created_at`,
		update.Status, update.ResultMeta, update.ErrorMessage, jobID).
		Scan(&j.ID, &j.EpisodeID, &j.JobType, &j.Status,
			&j.ResultMeta, &j.ErrorMessage, &j.RetryCount, &j.CreatedAt)
	if err != nil {
		return nil, err
	}
	return j, nil
}

func (r *InternalRepository) UpsertLocalization(ctx context.Context, episodeID int64, loc *model.LocalizationUpsert) (*model.Localization, error) {
	status := loc.Status
	if status == "" {
		status = "completed"
	}

	l := &model.Localization{}
	err := r.pool.QueryRow(ctx, `
		INSERT INTO localizations (episode_id, language, title_translated, dub_url, subtitle_url, lip_sync_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (episode_id, language) DO UPDATE SET
			title_translated=COALESCE(EXCLUDED.title_translated, localizations.title_translated),
			dub_url=COALESCE(EXCLUDED.dub_url, localizations.dub_url),
			subtitle_url=COALESCE(EXCLUDED.subtitle_url, localizations.subtitle_url),
			lip_sync_url=COALESCE(EXCLUDED.lip_sync_url, localizations.lip_sync_url),
			status=EXCLUDED.status,
			updated_at=NOW()
		RETURNING id, episode_id, language, title_translated, dub_url, subtitle_url, lip_sync_url, status`,
		episodeID, loc.Language, loc.TitleTranslated, loc.DubURL, loc.SubtitleURL, loc.LipSyncURL, status).
		Scan(&l.ID, &l.EpisodeID, &l.Language, &l.TitleTranslated,
			&l.DubURL, &l.SubtitleURL, &l.LipSyncURL, &l.Status)
	if err != nil {
		return nil, err
	}
	return l, nil
}
