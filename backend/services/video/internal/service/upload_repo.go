package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/ai-shot/video-svc/internal/model"
)

type UploadRepo struct {
	pool *pgxpool.Pool
}

func NewUploadRepo(pool *pgxpool.Pool) *UploadRepo {
	return &UploadRepo{pool: pool}
}

// ProcessUpload inserts into video_assets, updates episode status, and creates AI jobs.
func (r *UploadRepo) ProcessUpload(ctx context.Context, episodeID int64, fileURL string, fileSize int64, duration *int) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Insert video_assets record
	_, err = tx.Exec(ctx, `
		INSERT INTO video_assets (episode_id, resolution, file_url, file_size, duration)
		VALUES ($1, 'original', $2, $3, $4)`,
		episodeID, fileURL, fileSize, duration)
	if err != nil {
		return err
	}

	// Update episode status to ready
	_, err = tx.Exec(ctx, `
		UPDATE episodes SET status='ready', video_url=$1, updated_at=NOW() WHERE id=$2`,
		fileURL, episodeID)
	if err != nil {
		return err
	}

	// Create 4 AI jobs (asr, translate, dubbing, lipsync)
	for _, jobType := range []string{"asr", "translate", "dubbing", "lipsync"} {
		_, err = tx.Exec(ctx, `
			INSERT INTO ai_jobs (episode_id, job_type, status)
			VALUES ($1, $2, 'pending')`, episodeID, jobType)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

// UpdateEpisodeURL updates the episode's video_url after transcoding.
func (r *UploadRepo) UpdateEpisodeURL(ctx context.Context, episodeID int64, videoURL string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE episodes SET video_url=$1, updated_at=NOW() WHERE id=$2`,
		videoURL, episodeID)
	return err
}

// GetTasks returns AI jobs for a given episode ID.
func (r *UploadRepo) GetTasks(ctx context.Context, episodeID int64) ([]model.Task, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, episode_id, job_type, status, created_at
		 FROM ai_jobs WHERE episode_id = $1 ORDER BY id`, episodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []model.Task
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.EpisodeID, &t.JobType, &t.Status, &t.CreatedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, nil
}
