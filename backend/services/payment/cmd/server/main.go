package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ai-shot/pkg/database"
	"github.com/ai-shot/pkg/logger"
	"github.com/ai-shot/payment-svc/internal/config"
	"github.com/ai-shot/payment-svc/internal"
	"github.com/ai-shot/payment-svc/internal/repository"
	"github.com/ai-shot/payment-svc/internal/service"
)

func main() {
	logger.Init("debug", true)

	cfg := config.Load()
	ctx := context.Background()

	// Validate Stripe configuration (warn only — allow dev without Stripe)
	if cfg.Stripe.APIKey == "" {
		logger.Warn().Msg("STRIPE_API_KEY is empty — Stripe API calls will fail")
	}
	if cfg.Stripe.WebhookSecret == "" {
		logger.Warn().Msg("STRIPE_WEBHOOK_SECRET is empty — webhook signature validation will fail")
	}

	stripePriceIDs := map[string]string{
		"monthly":   cfg.Stripe.PriceMonthly,
		"quarterly": cfg.Stripe.PriceQuarterly,
		"yearly":    cfg.Stripe.PriceYearly,
	}
	for planType, id := range stripePriceIDs {
		if id == "" {
			logger.Warn().Str("plan", planType).Msg("Stripe Price ID is empty — checkout for this plan will fail")
		}
	}

	pool, err := database.NewPool(ctx, cfg.DB.DSN)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer pool.Close()
	logger.Info().Msg("database connected")

	router := internal.SetupRouter(pool, cfg.Stripe.APIKey, cfg.Stripe.WebhookSecret, stripePriceIDs)

	srv := &http.Server{
		Addr:    cfg.Server.Addr,
		Handler: router,
	}

	go func() {
		logger.Info().Str("addr", cfg.Server.Addr).Msg("starting payment service")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("server failed")
		}
	}()

	quit := make(chan struct{})

	// Subscription expiry cron — safety net for missed/ delayed Stripe webhooks
	expireRepo := repository.NewSubscriptionRepository(pool)
	expireSvc := service.NewSubscriptionService(expireRepo, cfg.Stripe.WebhookSecret, stripePriceIDs)

	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				n, err := expireSvc.ExpireStaleSubscriptions(ctx)
				if err != nil {
					logger.Error().Err(err).Msg("expire stale subscriptions failed")
				} else if n > 0 {
					logger.Info().Int64("count", n).Msg("expired stale subscriptions")
				}
			case <-quit:
				return
			}
		}
	}()

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		logger.Info().Msg("shutting down payment service...")
		close(quit)
	}()
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("server shutdown failed")
	}
}
