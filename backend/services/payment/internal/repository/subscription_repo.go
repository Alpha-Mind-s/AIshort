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
		`INSERT INTO subscriptions (user_id, plan_type, start_at, end_at, status, auto_renew, stripe_sub_id, created_at, updated_at)
	         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
		sub.UserID, sub.PlanType, sub.StartAt, sub.EndAt, sub.Status, sub.AutoRenew, sub.StripeSubID).Scan(&sub.ID)
}

func (r *SubscriptionRepository) FindActiveByUser(ctx context.Context, userID int64) (*model.Subscription, error) {
	sub := &model.Subscription{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, plan_type, start_at, end_at, status, auto_renew, COALESCE(stripe_sub_id,''), created_at, updated_at
	         FROM subscriptions WHERE user_id=$1 AND status='active' AND end_at > NOW() ORDER BY end_at DESC LIMIT 1`,
		userID).Scan(&sub.ID, &sub.UserID, &sub.PlanType, &sub.StartAt, &sub.EndAt, &sub.Status, &sub.AutoRenew, &sub.StripeSubID, &sub.CreatedAt, &sub.UpdatedAt)
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

// CreatePayment records a payment transaction.
func (r *SubscriptionRepository) CreatePayment(ctx context.Context, userID int64, subscriptionID int64, amount float64, currency string, channel string, channelTxnID string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO payments (user_id, subscription_id, amount, currency, status, channel, channel_txn_id, created_at)
	     VALUES ($1, $2, $3, $4, 'completed', $5, $6, NOW())
	     ON CONFLICT (channel, channel_txn_id) DO NOTHING`,
		userID, subscriptionID, amount, currency, channel, channelTxnID)
	return err
}

// ExpireStale marks subscriptions that are past their end_at as expired.
// Returns the number of rows updated.
func (r *SubscriptionRepository) ExpireStale(ctx context.Context) (int64, error) {
	tag, err := r.pool.Exec(ctx,
		`UPDATE subscriptions SET status='expired', updated_at=NOW()
		 WHERE status='active' AND end_at < NOW()`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
