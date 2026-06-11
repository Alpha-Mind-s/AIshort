package service

import (
	"context"
	"time"

	"golang.org/x/crypto/bcrypt"
	"github.com/redis/go-redis/v9"

	"github.com/ai-shot/pkg/auth"
	pkgErr "github.com/ai-shot/pkg/errors"
	"github.com/ai-shot/user-svc/internal/model"
	"github.com/ai-shot/user-svc/internal/repository"
)

type AuthService struct {
	userRepo *repository.UserRepository
	jwtAuth  *auth.JWTAuth
	rdb      *redis.Client
}

func NewAuthService(userRepo *repository.UserRepository, jwtAuth *auth.JWTAuth, rdb *redis.Client) *AuthService {
	return &AuthService{userRepo: userRepo, jwtAuth: jwtAuth, rdb: rdb}
}

func (s *AuthService) Register(ctx context.Context, req *model.RegisterRequest) (*model.AuthTokens, error) {
	existing, _ := s.userRepo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, pkgErr.ErrEmailExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, pkgErr.ErrInternal
	}

	user := &model.User{
		Email:        req.Email,
		Nickname:     req.Nickname,
		PasswordHash: string(hashedPassword),
		Role:         "user",
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, pkgErr.ErrInternal
	}

	return s.generateTokens(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, req *model.LoginRequest) (*model.AuthTokens, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, pkgErr.ErrInvalidCredentials
	}

	if user.Status == "banned" {
		return nil, pkgErr.ErrForbidden
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, pkgErr.ErrInvalidCredentials
	}

	return s.generateTokens(ctx, user)
}

func (s *AuthService) RefreshToken(ctx context.Context, userID int64, refreshToken string) (*model.AuthTokens, error) {
	valid, err := s.jwtAuth.ValidateRefreshToken(ctx, s.rdb, userID, refreshToken)
	if err != nil || !valid {
		return nil, pkgErr.ErrTokenInvalid
	}

	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, pkgErr.ErrTokenInvalid
	}

	s.jwtAuth.RevokeRefreshToken(ctx, s.rdb, userID)
	return s.generateTokens(ctx, user)
}

func (s *AuthService) Logout(ctx context.Context, accessToken string, userID int64) error {
	if err := s.jwtAuth.BlacklistAccessToken(ctx, s.rdb, accessToken, 15*time.Minute); err != nil {
		return pkgErr.ErrInternal
	}
	if err := s.jwtAuth.RevokeRefreshToken(ctx, s.rdb, userID); err != nil {
		return pkgErr.ErrInternal
	}
	return nil
}

func (s *AuthService) generateTokens(ctx context.Context, user *model.User) (*model.AuthTokens, error) {
	accessToken, expiresIn, err := s.jwtAuth.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		return nil, pkgErr.ErrInternal
	}

	refreshToken, err := s.jwtAuth.GenerateRefreshToken(ctx, s.rdb, user.ID)
	if err != nil {
		return nil, pkgErr.ErrInternal
	}

	return &model.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		User:         user,
	}, nil
}
