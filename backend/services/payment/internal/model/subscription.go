package model

import "time"

type Subscription struct {
	ID          int64     `json:"id"`
	UserID      int64     `json:"user_id"`
	PlanType    string    `json:"plan_type"`
	StartAt     time.Time `json:"start_at"`
	EndAt       time.Time `json:"end_at"`
	Status      string    `json:"status"`
	AutoRenew   bool      `json:"auto_renew"`
	StripeSubID string    `json:"stripe_sub_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type SubscriptionPlan struct {
	ID          int      `json:"id"`
	Name        string   `json:"name"`
	Price       float64  `json:"price"`
	Currency    string   `json:"currency"`
	Description string   `json:"description"`
	Features    []string `json:"features"`
}

type Payment struct {
	ID             int64     `json:"id"`
	UserID         int64     `json:"user_id"`
	SubscriptionID *int64    `json:"subscription_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	Channel        string    `json:"channel"`
	ChannelTxnID   string    `json:"channel_txn_id"`
	CreatedAt      time.Time `json:"created_at"`
}

type CreateSubscriptionRequest struct {
	PlanType  string `json:"plan_type" binding:"required,oneof=monthly quarterly yearly"`
	Channel   string `json:"channel" binding:"required,oneof=paypal stripe apple_pay google_pay"`
	ReturnURL string `json:"return_url"`
}

type CreateSubscriptionResponse struct {
	SubscriptionID int64  `json:"subscription_id"`
	PaymentURL     string `json:"payment_url"`
}
