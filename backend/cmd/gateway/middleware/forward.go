package middleware

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

// ForwardUserContext copies JWT user info from gin.Context into the proxied request headers.
// Must be used after JWTAuth middleware to ensure user_id and user_role are set.
func ForwardUserContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		if userID, exists := c.Get("user_id"); exists {
			c.Request.Header.Set("X-User-ID", fmt.Sprintf("%v", userID))
		}
		if userRole, exists := c.Get("user_role"); exists {
			c.Request.Header.Set("X-User-Role", fmt.Sprintf("%v", userRole))
		}
		c.Next()
	}
}
