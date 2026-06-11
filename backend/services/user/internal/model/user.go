package model

import (
	"errors"
	"time"
)

var ErrUserNotFound = errors.New("user not found")

type User struct {
	ID            int64     `json:"id"`
	Email         string    `json:"email"`
	Nickname      string    `json:"nickname"`
	AvatarURL     string    `json:"avatar_url"`
	PasswordHash  string    `json:"-"`
	OAuthProvider string    `json:"-"`
	OAuthID       string    `json:"-"`
	Role          string    `json:"role"`
	Language      string    `json:"language"`
	Region        string    `json:"region"`
	Status        string    `json:"-"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Nickname string `json:"nickname" binding:"required,min=1,max=100"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	User         *User  `json:"user"`
}
