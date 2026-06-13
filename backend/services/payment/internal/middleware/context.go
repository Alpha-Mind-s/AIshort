package middleware

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// ParseUserContext reads X-User-ID and X-User-Role headers set by the gateway's
// ForwardUserContext middleware and sets them on the gin context so downstream
// handlers can read user_id / user_role via c.GetInt64 / c.GetString.
func ParseUserContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		if uid := c.GetHeader("X-User-ID"); uid != "" {
			if id, err := strconv.ParseInt(uid, 10, 64); err == nil {
				c.Set("user_id", id)
			}
		}
		if role := c.GetHeader("X-User-Role"); role != "" {
			c.Set("user_role", role)
		}
		c.Next()
	}
}
