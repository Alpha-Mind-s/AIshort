package service

import (
	"context"
	"strconv"
	"time"

	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/payment-svc/internal/model"
	"github.com/ai-shot/payment-svc/internal/repository"
)

var Plans = []model.SubscriptionPlan{
	{ID: 1, Name: "monthly", Price: 9.99, Currency: "USD", Description: "Monthly subscription", Features: []string{"Unlimited viewing", "720p max quality"}},
	{ID: 2, Name: "quarterly", Price: 24.99, Currency: "USD", Description: "Quarterly subscription", Features: []string{"Unlimited viewing", "1080p max quality"}},
	{ID: 3, Name: "yearly", Price: 79.99, Currency: "USD", Description: "Yearly subscription", Features: []string{"Unlimited viewing", "4K max quality", "Early access"}},
}

type SubscriptionService struct {
	repo *repository.SubscriptionRepository
}

func NewSubscriptionService(repo *repository.SubscriptionRepository) *SubscriptionService {
	return &SubscriptionService{repo: repo}
}

func (s *SubscriptionService) GetPlans() []model.SubscriptionPlan {
	return Plans
}

func (s *SubscriptionService) Create(ctx context.Context, userID int64, req *model.CreateSubscriptionRequest) (*model.CreateSubscriptionResponse, error) {
	existing, _ := s.repo.FindActiveByUser(ctx, userID)
	if existing != nil {
		return nil, pkgErr.ErrSubscriptionExists
	}

	now := time.Now()
	var endAt time.Time
	switch req.PlanType {
	case "monthly":
		endAt = now.AddDate(0, 1, 0)
	case "quarterly":
		endAt = now.AddDate(0, 3, 0)
	case "yearly":
		endAt = now.AddDate(1, 0, 0)
	}

	sub := &model.Subscription{
		UserID:   userID,
		PlanType: req.PlanType,
		StartAt:  now,
		EndAt:    endAt,
	}

	if err := s.repo.Create(ctx, sub); err != nil {
		return nil, pkgErr.ErrInternal
	}

	return &model.CreateSubscriptionResponse{
		SubscriptionID: sub.ID,
		PaymentURL:     "https://pay.example.com/checkout/" + strconv.FormatInt(sub.ID, 10), // MVP mock
	}, nil
}

func (s *SubscriptionService) Cancel(ctx context.Context, userID int64) error {
	return s.repo.Cancel(ctx, userID)
}

func (s *SubscriptionService) Status(ctx context.Context, userID int64) (*model.Subscription, error) {
	return s.repo.FindActiveByUser(ctx, userID)
}
