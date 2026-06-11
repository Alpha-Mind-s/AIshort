ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_sub_id VARCHAR(255) DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_sub_id) WHERE stripe_sub_id != '';
