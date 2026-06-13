package service

import (
	"context"
	"fmt"
	"time"

	"github.com/stripe/stripe-go/v84"
	"github.com/stripe/stripe-go/v84/checkout/session"
	"github.com/stripe/stripe-go/v84/subscription"

	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/payment-svc/internal/model"
	"github.com/ai-shot/payment-svc/internal/repository"
)

// Plans — static subscription plans. In production these could come from the DB.
var Plans = []model.SubscriptionPlan{
	{ID: 1, Name: "monthly", Price: 9.99, Currency: "USD", Description: "Monthly subscription", Features: []string{"Unlimited viewing", "720p max quality"}},
	{ID: 2, Name: "quarterly", Price: 24.99, Currency: "USD", Description: "Quarterly subscription", Features: []string{"Unlimited viewing", "1080p max quality"}},
	{ID: 3, Name: "yearly", Price: 79.99, Currency: "USD", Description: "Yearly subscription", Features: []string{"Unlimited viewing", "4K max quality", "Early access"}},
}

type SubscriptionService struct {
	repo      *repository.SubscriptionRepository
	secret    string            // Stripe webhook secret
	priceIDs  map[string]string // plan type -> Stripe Price ID
}

func NewSubscriptionService(repo *repository.SubscriptionRepository, stripeSecret string, priceIDs map[string]string) *SubscriptionService {
	return &SubscriptionService{repo: repo, secret: stripeSecret, priceIDs: priceIDs}
}

func (s *SubscriptionService) GetPlans() []model.SubscriptionPlan {
	return Plans
}

// Create initiates a Stripe Checkout Session for the selected plan.
// The subscription is created in the DB only after Stripe confirms payment via webhook.
func (s *SubscriptionService) Create(ctx context.Context, userID int64, req *model.CreateSubscriptionRequest) (*model.CreateSubscriptionResponse, error) {
	// Check for existing active subscription
	existing, _ := s.repo.FindActiveByUser(ctx, userID)
	if existing != nil {
		return nil, pkgErr.ErrSubscriptionExists
	}

	if req.Channel != "stripe" {
		return nil, fmt.Errorf("payment channel not yet implemented: %s (use 'stripe')", req.Channel)
	}

	priceID := s.priceIDs[req.PlanType]
	if priceID == "" {
		return nil, fmt.Errorf("unknown plan type: %s", req.PlanType)
	}

	params := &stripe.CheckoutSessionParams{
		Mode:          stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL:    stripe.String(req.ReturnURL + "?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:     stripe.String(req.ReturnURL + "?canceled=true"),
		CustomerEmail: stripe.String(fmt.Sprintf("user_%d@aishot.internal", userID)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		Metadata: map[string]string{
			"user_id":   fmt.Sprintf("%d", userID),
			"plan_type": req.PlanType,
		},
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("stripe checkout session: %w", err)
	}

	return &model.CreateSubscriptionResponse{
		SubscriptionID: 0, // created by webhook
		PaymentURL:     sess.URL,
	}, nil
}

// Cancel cancels the subscription in Stripe and marks it non-renewing in the DB.
func (s *SubscriptionService) Cancel(ctx context.Context, userID int64) error {
	active, err := s.repo.FindActiveByUser(ctx, userID)
	if err != nil {
		return fmt.Errorf("no active subscription for user %d", userID)
	}

	// Cancel in Stripe
	if active.StripeSubID != "" {
		_, err := subscription.Cancel(active.StripeSubID, nil)
		if err != nil {
			return fmt.Errorf("stripe cancel: %w", err)
		}
	}

	return s.repo.Cancel(ctx, userID)
}

// Status returns the user's active subscription, if any.
func (s *SubscriptionService) Status(ctx context.Context, userID int64) (*model.Subscription, error) {
	return s.repo.FindActiveByUser(ctx, userID)
}

// ---------------------------------------------------------------------------
// Webhook helpers — called by the webhook handler
// ---------------------------------------------------------------------------

// ActivateSubscriptionFromCheckout processes a completed Stripe checkout session.
func (s *SubscriptionService) ActivateSubscriptionFromCheckout(ctx context.Context, cs *stripe.CheckoutSession) error {
	userIDStr := cs.Metadata["user_id"]
	planType := cs.Metadata["plan_type"]
	if userIDStr == "" || planType == "" {
		return fmt.Errorf("missing metadata in checkout session %s", cs.ID)
	}

	var userID int64
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		return fmt.Errorf("invalid user_id in metadata: %s", userIDStr)
	}

	// Check again for existing subscription (idempotency)
	existing, _ := s.repo.FindActiveByUser(ctx, userID)
	if existing != nil {
		return nil // already processed
	}

	now := time.Now()
	var endAt time.Time
	switch planType {
	case "monthly":
		endAt = now.AddDate(0, 1, 0)
	case "quarterly":
		endAt = now.AddDate(0, 3, 0)
	case "yearly":
		endAt = now.AddDate(1, 0, 0)
	default:
		return fmt.Errorf("unknown plan_type: %s", planType)
	}

	sub := &model.Subscription{
		UserID:      userID,
		PlanType:    planType,
		StartAt:     now,
		EndAt:       endAt,
		Status:      "active",
		AutoRenew:   true,
		StripeSubID: "",
	}

	// Extract Stripe subscription ID if this was a subscription checkout
	if cs.Subscription != nil {
		sub.StripeSubID = cs.Subscription.ID
	}

	if err := s.repo.Create(ctx, sub); err != nil {
		return fmt.Errorf("create subscription: %w", err)
	}

	// Record the payment
	amount := planPrice(planType)
	_ = s.repo.CreatePayment(ctx, userID, sub.ID, float64(amount)/100, "usd", "stripe", cs.ID)

	return nil
}

// HandleSubscriptionDeleted marks the subscription as cancelled when Stripe deletes it.
func (s *SubscriptionService) HandleSubscriptionDeleted(ctx context.Context, sub stripe.Subscription) error {
	userIDStr := sub.Metadata["user_id"]
	if userIDStr == "" {
		return fmt.Errorf("missing user_id in subscription metadata: %s", sub.ID)
	}
	var userID int64
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		return fmt.Errorf("invalid user_id in metadata: %s", userIDStr)
	}
	return s.repo.Cancel(ctx, userID)
}

// HandleSubscriptionUpdated keeps the local DB in sync when Stripe subscription changes.
func (s *SubscriptionService) HandleSubscriptionUpdated(ctx context.Context, sub stripe.Subscription) error {
	userIDStr := sub.Metadata["user_id"]
	if userIDStr == "" {
		return fmt.Errorf("missing user_id in subscription metadata: %s", sub.ID)
	}
	var userID int64
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		return fmt.Errorf("invalid user_id in metadata: %s", userIDStr)
	}

	switch sub.Status {
	case stripe.SubscriptionStatusCanceled, stripe.SubscriptionStatusIncompleteExpired, stripe.SubscriptionStatusUnpaid:
		return s.repo.Cancel(ctx, userID)
	}
	return nil
}

// planPrice returns the price in cents for a plan type.
func planPrice(planType string) int64 {
	switch planType {
	case "monthly":
		return 999
	case "quarterly":
		return 2499
	case "yearly":
		return 7999
	}
	return 0
}

// ExpireStaleSubscriptions marks expired subscriptions and returns how many were affected.
// This is a safety net — Stripe webhooks handle the normal case.
func (s *SubscriptionService) ExpireStaleSubscriptions(ctx context.Context) (int64, error) {
	return s.repo.ExpireStale(ctx)
}
