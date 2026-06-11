package config

import "github.com/ai-shot/pkg/config"

type Config struct {
	Server config.ServerConfig
	DB     config.DatabaseConfig
	Redis  config.RedisConfig
	JWT    config.JWTConfig
}

func Load() *Config {
	cfg := &Config{}
	cfg.Server.Load("USER_SVC")
	cfg.DB.Load("DB")
	cfg.Redis.Load("REDIS")
	cfg.JWT.Load("JWT")
	return cfg
}
