package redis

import (
	"context"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

func NewClient(ctx context.Context, addr string) (*goredis.Client, error) {
	rdb := goredis.NewClient(&goredis.Options{
		Addr:         addr,
		MinIdleConns: 5,
		PoolSize:     20,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	return rdb, nil
}
