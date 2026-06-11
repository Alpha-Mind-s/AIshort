package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ai-shot/payment-svc/internal/model"
)

type SubscriptionRepository struct {
	pool *pgxpool.Pool
}

func NewSubscriptionRepository(pool *pgxpool.Pool) *SubscriptionRepository {
	return &SubscriptionRepository{pool: pool}
}

func (r *SubscriptionRepository) Create(ctx context.Context, sub *model.Subscription) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO subscriptions (user_id, plan_type, start_at, end_at, status, auto_renew, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', true, NOW(), NOW()) RETURNING id`,
		sub.UserID, sub.PlanType, sub.StartAt, sub.EndAt).Scan(&sub.ID)
}

func (r *SubscriptionRepository) FindActiveByUser(ctx context.Context, userID int64) (*model.Subscription, error) {
	sub := &model.Subscription{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, plan_type, start_at, end_at, status, auto_renew, created_at, updated_at
         FROM subscriptions WHERE user_id=$1 AND status='active' AND end_at > NOW() ORDER BY end_at DESC LIMIT 1`,
		userID).Scan(&sub.ID, &sub.UserID, &sub.PlanType, &sub.StartAt, &sub.EndAt, &sub.Status, &sub.AutoRenew, &sub.CreatedAt, &sub.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return sub, nil
}

func (r *SubscriptionRepository) Cancel(ctx context.Context, userID int64) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE subscriptions SET auto_renew=false, updated_at=NOW() WHERE user_id=$1 AND status='active'", userID)
	return err
}
