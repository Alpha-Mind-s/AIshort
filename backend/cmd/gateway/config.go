package main

import (
    "os"
    "strings"

    "github.com/ai-shot/pkg/config"
)

type GatewayConfig struct {
    Server         config.ServerConfig
    Redis          config.RedisConfig
    JWT            config.JWTConfig
    Services       ServiceConfig
    MinIO          MinIOConfig
    FileCDNURL     string // base URL for constructing file download URLs
    UploadBucket   string // MinIO bucket for generic file uploads
    InternalApiKey string
}

type ServiceConfig struct {
    UserSvcAddr    string
    ContentSvcAddr string
    VideoSvcAddr   string
    PaymentSvcAddr string
}

type MinIOConfig struct {
    Endpoint  string
    AccessKey string
    SecretKey string
}

func LoadConfig() *GatewayConfig {
    cfg := &GatewayConfig{}
    cfg.Server.Load("GATEWAY")
    cfg.Redis.Load("REDIS")
    cfg.JWT.Load("JWT")
    cfg.Services = ServiceConfig{
        UserSvcAddr:    getEnv("USER_SVC_ADDR", "localhost:8081"),
        ContentSvcAddr: getEnv("CONTENT_SVC_ADDR", "localhost:8082"),
        VideoSvcAddr:   getEnv("VIDEO_SVC_ADDR", "localhost:8083"),
        PaymentSvcAddr: getEnv("PAYMENT_SVC_ADDR", "localhost:8084"),
    }
    cfg.MinIO = MinIOConfig{
        Endpoint:  getEnv("S3_ENDPOINT", "minio:9000"),
        AccessKey: getEnv("S3_ACCESS_KEY", "minioadmin"),
        SecretKey: getEnv("S3_SECRET_KEY", "minioadmin"),
    }
    cfg.FileCDNURL = getEnv("FILE_CDN_URL", "http://localhost:8080/files")
    cfg.UploadBucket = getEnv("FILE_BUCKET", "aishot-videos")
    cfg.InternalApiKey = getEnv("INTERNAL_API_KEY", "dev-internal-key")
    return cfg
}

func (c *GatewayConfig) AllowedOrigins() []string {
    origins := getEnv("CORS_ORIGINS", "*")
    if origins == "*" {
        return nil
    }
    return strings.Split(origins, ",")
}

func getEnv(key, defaultVal string) string {
    if val := os.Getenv(key); val != "" {
        return val
    }
    return defaultVal
}
