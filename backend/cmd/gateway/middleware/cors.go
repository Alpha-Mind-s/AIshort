package middleware

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

func CORS(allowedOrigins ...string) gin.HandlerFunc {
    originMap := make(map[string]bool)
    for _, o := range allowedOrigins {
        if o != "" {
            originMap[o] = true
        }
    }

    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")
        useCredentials := false

        // Echo back the request origin when allowed. Never use "*" with
        // credentials — browsers reject that combination per the spec.
        if origin != "" && (len(originMap) == 0 || originMap[origin]) {
            c.Header("Access-Control-Allow-Origin", origin)
            useCredentials = true
        } else if len(originMap) == 0 {
            c.Header("Access-Control-Allow-Origin", "*")
        } else {
            // Origin not in whitelist, fall back to first allowed origin
            for o := range originMap {
                c.Header("Access-Control-Allow-Origin", o)
                break
            }
            useCredentials = true
        }

        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Range, X-Request-ID")
        if useCredentials {
            c.Header("Access-Control-Allow-Credentials", "true")
        }
        c.Header("Access-Control-Max-Age", "86400")

        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}
