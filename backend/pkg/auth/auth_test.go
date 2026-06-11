package auth

import (
	"testing"
	"time"

	"github.com/ai-shot/pkg/config"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	cfg := config.JWTConfig{
		Secret:          "test-secret",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 30 * 24 * time.Hour,
	}
	j := NewJWTAuth(cfg)

	token, expiresIn, err := j.GenerateAccessToken(123, "user")
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}
	if expiresIn != 900 {
		t.Errorf("expected 900, got %d", expiresIn)
	}

	claims, err := j.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("validate token: %v", err)
	}
	if claims.UserID != 123 {
		t.Errorf("expected userID 123, got %d", claims.UserID)
	}
	if claims.Role != "user" {
		t.Errorf("expected role 'user', got '%s'", claims.Role)
	}
}

func TestValidateInvalidToken(t *testing.T) {
	cfg := config.JWTConfig{Secret: "test", AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 30 * 24 * time.Hour}
	j := NewJWTAuth(cfg)

	_, err := j.ValidateAccessToken("invalid-token")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}
