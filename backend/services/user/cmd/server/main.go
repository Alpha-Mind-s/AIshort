package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/ai-shot/pkg/database"
	"github.com/ai-shot/pkg/logger"
	"github.com/ai-shot/pkg/redis"
	"github.com/ai-shot/user-svc/internal/config"
	"github.com/ai-shot/user-svc/internal"
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

	rdb, err := redis.NewClient(ctx, cfg.Redis.Addr)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to connect to redis")
	}
	defer rdb.Close()
	logger.Info().Msg("redis connected")

	router := internal.SetupRouter(pool, rdb, cfg.JWT)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		logger.Info().Msg("shutting down server...")
	}()

	logger.Info().Str("addr", cfg.Server.Addr).Msg("starting user service")
	if err := router.Run(cfg.Server.Addr); err != nil {
		logger.Fatal().Err(err).Msg("server failed")
	}
}
