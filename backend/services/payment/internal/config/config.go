package config

import (
	"os"

	"github.com/ai-shot/pkg/config"
)

type Config struct {
	Server config.ServerConfig
	DB     config.DatabaseConfig
	PayPal PayPalConfig
}

type PayPalConfig struct {
	ClientID     string
	ClientSecret string
}

func Load() *Config {
	cfg := &Config{}
	cfg.Server.Load("PAYMENT_SVC")
	cfg.DB.Load("DB")
	cfg.PayPal.ClientID = os.Getenv("PAYPAL_CLIENT_ID")
	cfg.PayPal.ClientSecret = os.Getenv("PAYPAL_CLIENT_SECRET")
	return cfg
}
