package middleware

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/ai-shot/pkg/logger"
)

func RequestLogger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path

        c.Next()

        latency := time.Since(start)
        status := c.Writer.Status()

        logger.Info().
            Int("status", status).
            Str("method", c.Request.Method).
            Str("path", path).
            Dur("latency", latency).
            Int("size", c.Writer.Size()).
            Msg("request")
    }
}
