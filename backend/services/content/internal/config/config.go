package config

import "github.com/ai-shot/pkg/config"

type Config struct {
    Server config.ServerConfig
    DB     config.DatabaseConfig
}

func Load() *Config {
    cfg := &Config{}
    cfg.Server.Load("CONTENT_SVC")
    cfg.DB.Load("DB")
    return cfg
}
