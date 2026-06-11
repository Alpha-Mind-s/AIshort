package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ai-shot/pkg/logger"
	"github.com/ai-shot/video-svc/internal"
	"github.com/ai-shot/video-svc/internal/config"
)

func main() {
	logger.Init("debug", true)

	cfg := config.Load()

	router := internal.SetupRouter(cfg.S3.Endpoint, cfg.S3.Bucket, cfg.S3.CDNURL)

	srv := &http.Server{
		Addr:    cfg.Server.Addr,
		Handler: router,
	}

	go func() {
		logger.Info().Str("addr", cfg.Server.Addr).Msg("starting video service")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("server failed")
		}
	}()

	quit := make(chan struct{})
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		logger.Info().Msg("shutting down video service...")
		close(quit)
	}()
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Fatal().Err(err).Msg("server shutdown failed")
	}
}
