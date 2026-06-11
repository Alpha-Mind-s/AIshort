DROP INDEX IF EXISTS idx_subscriptions_stripe;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_sub_id;
