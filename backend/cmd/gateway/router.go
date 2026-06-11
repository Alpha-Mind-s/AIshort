package main

import (
    "net/http/httputil"
    "net/url"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"

    "github.com/ai-shot/pkg/auth"
    "github.com/ai-shot/pkg/config"
    "github.com/ai-shot/gateway/middleware"
)

func SetupRouter(rdb *redis.Client, cfg *GatewayConfig) *gin.Engine {
    r := gin.New()
    r.Use(gin.Recovery())
    r.Use(middleware.CORS())
    r.Use(middleware.RequestLogger())

    jwtCfg := config.JWTConfig{
        Secret:          cfg.JWT.Secret,
        AccessTokenTTL:  cfg.JWT.AccessTokenTTL,
        RefreshTokenTTL: cfg.JWT.RefreshTokenTTL,
    }
    jwtAuth := auth.NewJWTAuth(jwtCfg)
    authMiddleware := middleware.JWTAuth(jwtAuth, rdb)
    limiter := middleware.NewRateLimiter(rdb, 60, time.Minute)

    api := r.Group("/api/v1")
    api.Use(limiter.Limit(60))
    {
        auth := api.Group("/auth")
        {
            auth.POST("/register", proxyTo(cfg.Services.UserSvcAddr))
            auth.POST("/login", proxyTo(cfg.Services.UserSvcAddr))
            auth.POST("/refresh", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))
            auth.POST("/logout", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))
        }

        user := api.Group("/users")
        user.Use(authMiddleware)
        {
            user.GET("/me", proxyTo(cfg.Services.UserSvcAddr))
            user.PUT("/me", proxyTo(cfg.Services.UserSvcAddr))
        }

        fav := api.Group("/favorites")
        fav.Use(authMiddleware)
        {
            fav.POST("", proxyTo(cfg.Services.UserSvcAddr))
            fav.GET("", proxyTo(cfg.Services.UserSvcAddr))
            fav.DELETE("/:id", proxyTo(cfg.Services.UserSvcAddr))
        }

        api.POST("/dramas/:id/comments", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))
        api.GET("/dramas/:id/comments", proxyTo(cfg.Services.UserSvcAddr))
        api.DELETE("/comments/:id", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))
        api.POST("/comments/:id/like", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))

        api.GET("/dramas", proxyTo(cfg.Services.ContentSvcAddr))
        api.GET("/dramas/:id", proxyTo(cfg.Services.ContentSvcAddr))
        api.GET("/dramas/:id/episodes", proxyTo(cfg.Services.ContentSvcAddr))
        api.GET("/episodes/:id", authMiddleware, proxyTo(cfg.Services.ContentSvcAddr))
        api.GET("/episodes/:id/play", authMiddleware, proxyTo(cfg.Services.ContentSvcAddr))
        api.GET("/categories", proxyTo(cfg.Services.ContentSvcAddr))

        video := api.Group("/videos")
        video.Use(authMiddleware)
        {
            video.POST("/upload-url", proxyTo(cfg.Services.VideoSvcAddr))
            video.POST("/multipart/init", proxyTo(cfg.Services.VideoSvcAddr))
            video.POST("/multipart/complete", proxyTo(cfg.Services.VideoSvcAddr))
            video.POST("/callback", proxyTo(cfg.Services.VideoSvcAddr))
            video.GET("/:id/tasks", proxyTo(cfg.Services.VideoSvcAddr))
        }

        sub := api.Group("/subscriptions")
        sub.Use(authMiddleware)
        {
            sub.POST("/create", proxyTo(cfg.Services.PaymentSvcAddr))
            sub.POST("/cancel", proxyTo(cfg.Services.PaymentSvcAddr))
            sub.GET("/status", proxyTo(cfg.Services.PaymentSvcAddr))
        }
        api.GET("/subscriptions/plans", proxyTo(cfg.Services.PaymentSvcAddr))
        api.POST("/payments/webhook/:channel", proxyTo(cfg.Services.PaymentSvcAddr))
    }

    return r
}

func proxyTo(target string) gin.HandlerFunc {
    return func(c *gin.Context) {
        remote, err := url.Parse("http://" + target)
        if err != nil {
            c.AbortWithStatusJSON(500, gin.H{"error": "invalid target"})
            return
        }
        proxy := httputil.NewSingleHostReverseProxy(remote)
        proxy.ServeHTTP(c.Writer, c.Request)
    }
}
