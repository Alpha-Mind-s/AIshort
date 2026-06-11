package config

import (
	"os"

	"github.com/ai-shot/pkg/config"
)

type Config struct {
	Server config.ServerConfig
	DB     config.DatabaseConfig
	S3     S3Config
}

type S3Config struct {
	Endpoint  string
	Bucket    string
	AccessKey string
	SecretKey string
	CDNURL    string
}

func Load() *Config {
	cfg := &Config{}
	cfg.Server.Load("VIDEO_SVC")
	cfg.DB.Load("DB")
	cfg.S3.Endpoint = getEnv("S3_ENDPOINT", "http://localhost:9000")
	cfg.S3.Bucket = getEnv("S3_BUCKET", "aishot-videos")
	cfg.S3.AccessKey = getEnv("S3_ACCESS_KEY", "minioadmin")
	cfg.S3.SecretKey = getEnv("S3_SECRET_KEY", "minioadmin")
	cfg.S3.CDNURL = getEnv("CDN_URL", "http://localhost:8080")
	return cfg
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
