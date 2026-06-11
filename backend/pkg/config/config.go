package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Addr string
}

func (s *ServerConfig) Load(prefix string) {
	s.Addr = getEnv(prefix+"_ADDR", ":8080")
}

type DatabaseConfig struct {
	DSN string
}

func (d *DatabaseConfig) Load(prefix string) {
	d.DSN = getEnv(prefix+"_DSN", "postgres://aishot:aishot@localhost:5432/aishot?sslmode=disable")
}

type RedisConfig struct {
	Addr string
}

func (r *RedisConfig) Load(prefix string) {
	r.Addr = getEnv(prefix+"_ADDR", "localhost:6379")
}

type JWTConfig struct {
	Secret          string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
}

func (j *JWTConfig) Load(prefix string) {
	j.Secret = getEnv(prefix+"_SECRET", "dev-secret-change-in-production")
	accessTTL, _ := strconv.Atoi(getEnv(prefix+"_ACCESS_TTL", "900"))
	j.AccessTokenTTL = time.Duration(accessTTL) * time.Second
	refreshTTL, _ := strconv.Atoi(getEnv(prefix+"_REFRESH_TTL", "2592000"))
	j.RefreshTokenTTL = time.Duration(refreshTTL) * time.Second
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
