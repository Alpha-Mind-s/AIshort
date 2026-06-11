package main

import (
    "context"

    "github.com/ai-shot/pkg/logger"
    "github.com/ai-shot/pkg/redis"
)

func main() {
    logger.Init("debug", false)

    cfg := LoadConfig()
    ctx := context.Background()

    rdb, err := redis.NewClient(ctx, cfg.Redis.Addr)
    if err != nil {
        logger.Fatal().Err(err).Msg("failed to connect to redis")
    }
    defer rdb.Close()
    logger.Info().Msg("redis connected")

    router := SetupRouter(rdb, cfg)

    logger.Info().Str("addr", cfg.Server.Addr).Msg("starting gateway")
    if err := router.Run(cfg.Server.Addr); err != nil {
        logger.Fatal().Err(err).Msg("gateway failed")
    }
}
