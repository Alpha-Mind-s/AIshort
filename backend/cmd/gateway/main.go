package main

import (
    "context"

    "github.com/minio/minio-go/v7"
    "github.com/minio/minio-go/v7/pkg/credentials"

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

    minioClient, err := minio.New(cfg.MinIO.Endpoint, &minio.Options{
        Creds:  credentials.NewStaticV4(cfg.MinIO.AccessKey, cfg.MinIO.SecretKey, ""),
        Secure: false,
    })
    if err != nil {
        logger.Fatal().Err(err).Msg("failed to create minio client")
    }
    logger.Info().Msg("minio client created")

    router := SetupRouter(rdb, minioClient, cfg)

    logger.Info().Str("addr", cfg.Server.Addr).Msg("starting gateway")
    if err := router.Run(cfg.Server.Addr); err != nil {
        logger.Fatal().Err(err).Msg("gateway failed")
    }
}
