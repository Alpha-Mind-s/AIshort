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

        // 在 allowedOrigins 中或未指定时使用请求的 Origin
        if origin != "" && (len(originMap) == 0 || originMap[origin]) {
            c.Header("Access-Control-Allow-Origin", origin)
        } else if len(originMap) == 0 {
            c.Header("Access-Control-Allow-Origin", "*")
        } else {
            // 不在白名单中且存在白名单，使用第一个
            for o := range originMap {
                c.Header("Access-Control-Allow-Origin", o)
                break
            }
        }

        c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID")
        c.Header("Access-Control-Allow-Credentials", "true")
        c.Header("Access-Control-Max-Age", "86400")

        if c.Request.Method == http.MethodOptions {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}
