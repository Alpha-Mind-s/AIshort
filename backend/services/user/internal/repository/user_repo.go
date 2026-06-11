package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ai-shot/user-svc/internal/model"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	query := `INSERT INTO users (email, nickname, password_hash, role, status, created_at, updated_at)
			  VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
			  RETURNING id, created_at`
	return r.pool.QueryRow(ctx, query, user.Email, user.Nickname, user.PasswordHash, user.Role).
		Scan(&user.ID, &user.CreatedAt)
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, email, nickname, avatar_url, password_hash, role, language, region, status, created_at, updated_at
			  FROM users WHERE email = $1`
	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Nickname, &user.AvatarURL,
		&user.PasswordHash, &user.Role, &user.Language, &user.Region,
		&user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int64) (*model.User, error) {
	query := `SELECT id, email, nickname, avatar_url, password_hash, role, language, region, status, created_at, updated_at
			  FROM users WHERE id = $1`
	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.Nickname, &user.AvatarURL,
		&user.PasswordHash, &user.Role, &user.Language, &user.Region,
		&user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return user, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, user *model.User) error {
	query := `UPDATE users SET nickname=$1, avatar_url=$2, language=$3, region=$4, updated_at=NOW() WHERE id=$5`
	_, err := r.pool.Exec(ctx, query, user.Nickname, user.AvatarURL, user.Language, user.Region, user.ID)
	return err
}

func (r *UserRepository) FindByOAuth(ctx context.Context, provider, oauthID string) (*model.User, error) {
	query := `SELECT id, email, nickname, avatar_url, role, language, region, status, created_at, updated_at
			  FROM users WHERE oauth_provider=$1 AND oauth_id=$2`
	user := &model.User{}
	err := r.pool.QueryRow(ctx, query, provider, oauthID).Scan(
		&user.ID, &user.Email, &user.Nickname, &user.AvatarURL,
		&user.Role, &user.Language, &user.Region,
		&user.Status, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("find user by oauth: %w", err)
	}
	return user, nil
}
