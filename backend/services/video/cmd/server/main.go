package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/ai-shot/pkg/logger"
	"github.com/ai-shot/video-svc/internal"
	"github.com/ai-shot/video-svc/internal/config"
)

func main() {
	logger.Init("debug", true)

	cfg := config.Load()

	router := internal.SetupRouter(cfg.S3.Endpoint, cfg.S3.Bucket, cfg.S3.CDNURL)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		logger.Info().Msg("shutting down video service...")
	}()

	logger.Info().Str("addr", cfg.Server.Addr).Msg("starting video service")
	if err := router.Run(cfg.Server.Addr); err != nil {
		logger.Fatal().Err(err).Msg("server failed")
	}
}
