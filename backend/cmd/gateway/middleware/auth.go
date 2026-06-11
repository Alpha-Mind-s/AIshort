package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"

    "github.com/ai-shot/pkg/auth"
    "github.com/ai-shot/pkg/response"
    pkgErr "github.com/ai-shot/pkg/errors"
)

func JWTAuth(jwtAuth *auth.JWTAuth, rdb *redis.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
            c.Abort()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            response.Error(c, http.StatusUnauthorized, pkgErr.ErrUnauthorized.Code, pkgErr.ErrUnauthorized.Message)
            c.Abort()
            return
        }

        tokenString := parts[1]

        blacklisted, err := jwtAuth.IsBlacklisted(c.Request.Context(), rdb, tokenString)
        if err != nil || blacklisted {
            response.Error(c, http.StatusUnauthorized, pkgErr.ErrTokenInvalid.Code, pkgErr.ErrTokenInvalid.Message)
            c.Abort()
            return
        }

        claims, err := jwtAuth.ValidateAccessToken(tokenString)
        if err != nil {
            response.Error(c, http.StatusUnauthorized, pkgErr.ErrTokenInvalid.Code, pkgErr.ErrTokenInvalid.Message)
            c.Abort()
            return
        }

        c.Set("user_id", claims.UserID)
        c.Set("user_role", claims.Role)
        c.Set("access_token", tokenString)
        c.Next()
    }
}
