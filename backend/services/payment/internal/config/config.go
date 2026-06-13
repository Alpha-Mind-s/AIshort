package config

import (
	"os"

	"github.com/ai-shot/pkg/config"
)

type Config struct {
	Server config.ServerConfig
	DB     config.DatabaseConfig
	PayPal PayPalConfig
	Stripe StripeConfig
}

type PayPalConfig struct {
	ClientID     string
	ClientSecret string
}

type StripeConfig struct {
	APIKey         string
	WebhookSecret  string
	PriceMonthly   string
	PriceQuarterly string
	PriceYearly    string
}

func Load() *Config {
	cfg := &Config{}
	cfg.Server.Load("PAYMENT_SVC")
	cfg.DB.Load("DB")
	cfg.PayPal.ClientID = os.Getenv("PAYPAL_CLIENT_ID")
	cfg.PayPal.ClientSecret = os.Getenv("PAYPAL_CLIENT_SECRET")
	cfg.Stripe.APIKey = getEnv("STRIPE_API_KEY", "")
	cfg.Stripe.WebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET", "")
	cfg.Stripe.PriceMonthly = getEnv("STRIPE_PRICE_MONTHLY", "")
	cfg.Stripe.PriceQuarterly = getEnv("STRIPE_PRICE_QUARTERLY", "")
	cfg.Stripe.PriceYearly = getEnv("STRIPE_PRICE_YEARLY", "")
	return cfg
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
