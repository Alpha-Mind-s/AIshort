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
)

func main() {
	logger.Init("debug", true)

	cfg := config.Load()
	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg.DB.DSN)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer pool.Close()
	logger.Info().Msg("database connected")

	router := internal.SetupRouter(pool, cfg.Stripe.APIKey, cfg.Stripe.WebhookSecret)

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
