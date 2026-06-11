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
    InternalApiKey string
}

type ServiceConfig struct {
    UserSvcAddr    string
    ContentSvcAddr string
    VideoSvcAddr   string
    PaymentSvcAddr string
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
