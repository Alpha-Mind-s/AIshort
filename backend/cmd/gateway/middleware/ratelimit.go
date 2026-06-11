package middleware

import (
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"

    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
)

type RateLimiter struct {
    rdb    *redis.Client
    limit  int
    window time.Duration
}

func NewRateLimiter(rdb *redis.Client, limit int, window time.Duration) *RateLimiter {
    return &RateLimiter{rdb: rdb, limit: limit, window: window}
}

func (rl *RateLimiter) Limit(limit int) gin.HandlerFunc {
    return func(c *gin.Context) {
        key := "rate_limit:" + c.ClientIP() + ":" + c.FullPath()

        count, err := rl.rdb.Incr(c.Request.Context(), key).Result()
        if err != nil {
            c.Next()
            return
        }

        if count == 1 {
            rl.rdb.Expire(c.Request.Context(), key, rl.window)
        }

        if count > int64(limit) {
            response.Error(c, http.StatusTooManyRequests, pkgErr.ErrTooManyRequests.Code, pkgErr.ErrTooManyRequests.Message)
            c.Abort()
            return
        }

        c.Header("X-RateLimit-Remaining", strconv.FormatInt(int64(limit)-count, 10))
        c.Next()
    }
}
