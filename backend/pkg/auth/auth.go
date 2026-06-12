package auth

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	goredis "github.com/redis/go-redis/v9"

	"github.com/ai-shot/pkg/config"
)

type AccessClaims struct {
	UserID int64  `json:"uid"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type JWTAuth struct {
	secret          []byte
	accessTTL       time.Duration
	refreshTTL      time.Duration
}

func NewJWTAuth(cfg config.JWTConfig) *JWTAuth {
	return &JWTAuth{
		secret:     []byte(cfg.Secret),
		accessTTL:  cfg.AccessTokenTTL,
		refreshTTL: cfg.RefreshTokenTTL,
	}
}

func (a *JWTAuth) GenerateAccessToken(userID int64, role string) (string, int64, error) {
	now := time.Now()
	expiresAt := now.Add(a.accessTTL)

	claims := AccessClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   fmt.Sprintf("%d", userID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(a.secret)
	if err != nil {
		return "", 0, fmt.Errorf("sign token: %w", err)
	}

	return signed, int64(a.accessTTL.Seconds()), nil
}

func (a *JWTAuth) ValidateAccessToken(tokenString string) (*AccessClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return a.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*AccessClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

func (a *JWTAuth) GenerateRefreshToken(ctx context.Context, rdb *goredis.Client, userID int64) (string, error) {
	token := uuid.New().String()
	key := fmt.Sprintf("refresh_token:%s", token)

	// Store userID under the token key so we can look up the user
	// without knowing their ID ahead of time (required for the refresh
	// flow where the expired access token can't provide the user ID).
	if err := rdb.Set(ctx, key, userID, a.refreshTTL).Err(); err != nil {
		return "", fmt.Errorf("store refresh token: %w", err)
	}

	return token, nil
}

// ValidateRefreshToken returns the user ID for a valid refresh token, or 0 if invalid.
func (a *JWTAuth) ValidateRefreshToken(ctx context.Context, rdb *goredis.Client, token string) (int64, error) {
	key := fmt.Sprintf("refresh_token:%s", token)
	val, err := rdb.Get(ctx, key).Result()
	if err == goredis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get refresh token: %w", err)
	}
	userID, err := strconv.ParseInt(val, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse user id from refresh token: %w", err)
	}
	return userID, nil
}

func (a *JWTAuth) BlacklistAccessToken(ctx context.Context, rdb *goredis.Client, tokenString string, ttl time.Duration) error {
	key := fmt.Sprintf("blacklist:%s", tokenString)
	return rdb.Set(ctx, key, "1", ttl).Err()
}

func (a *JWTAuth) IsBlacklisted(ctx context.Context, rdb *goredis.Client, tokenString string) (bool, error) {
	key := fmt.Sprintf("blacklist:%s", tokenString)
	_, err := rdb.Get(ctx, key).Result()
	if err == goredis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (a *JWTAuth) RevokeRefreshToken(ctx context.Context, rdb *goredis.Client, token string) error {
	key := fmt.Sprintf("refresh_token:%s", token)
	return rdb.Del(ctx, key).Err()
}
