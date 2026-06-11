package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

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

	router := internal.SetupRouter(pool)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		logger.Info().Msg("shutting down payment service...")
	}()

	logger.Info().Str("addr", cfg.Server.Addr).Msg("starting payment service")
	if err := router.Run(cfg.Server.Addr); err != nil {
		logger.Fatal().Err(err).Msg("server failed")
	}
}
