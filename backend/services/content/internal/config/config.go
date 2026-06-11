package config

import "github.com/ai-shot/pkg/config"

type Config struct {
    Server config.ServerConfig
    DB     config.DatabaseConfig
    Redis  config.RedisConfig
}

func Load() *Config {
    cfg := &Config{}
    cfg.Server.Load("CONTENT_SVC")
    cfg.DB.Load("DB")
    cfg.Redis.Load("REDIS")
    return cfg
}
