package main

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"

	"github.com/ai-shot/pkg/auth"
	"github.com/ai-shot/pkg/config"
	"github.com/ai-shot/gateway/middleware"
)

func SetupRouter(rdb *redis.Client, minioClient *minio.Client, cfg *GatewayConfig) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.CORS(cfg.AllowedOrigins()...))
	r.Use(middleware.RequestLogger())

	jwtCfg := config.JWTConfig{
		Secret:          cfg.JWT.Secret,
		AccessTokenTTL:  cfg.JWT.AccessTokenTTL,
		RefreshTokenTTL: cfg.JWT.RefreshTokenTTL,
	}
	jwtAuth := auth.NewJWTAuth(jwtCfg)
	authMiddleware := middleware.JWTAuth(jwtAuth, rdb)

	generalLimiter := middleware.NewRateLimiter(rdb, 60, time.Minute)
	authLimiter := middleware.NewRateLimiter(rdb, 10, time.Minute)

	userCtxMiddleware := middleware.ForwardUserContext()

	// File proxy — serve MinIO files through gateway (bucket stays private)
	// Support both GET (streaming) and HEAD (metadata checks by browsers/video players)
	r.Match([]string{"GET", "HEAD"}, "/files/*filepath", proxyToMinIO(minioClient))

	api := r.Group("/api/v1")
	api.Use(generalLimiter.Limit(60))
	{
		auth := api.Group("/auth")
		auth.Use(authLimiter.Limit(10))
		{
			auth.POST("/register", proxyTo(cfg.Services.UserSvcAddr))
			auth.POST("/login", proxyTo(cfg.Services.UserSvcAddr))
			// /refresh is a public endpoint — it authenticates via the refresh_token in the
			// request body, not via the (already expired) access token in the Authorization header.
			auth.POST("/refresh", proxyTo(cfg.Services.UserSvcAddr))
			auth.POST("/logout", authMiddleware, proxyTo(cfg.Services.UserSvcAddr))

			// OAuth — proxy to user-service
			auth.GET("/oauth/:provider", proxyTo(cfg.Services.UserSvcAddr))
			auth.POST("/oauth/:provider/callback", proxyTo(cfg.Services.UserSvcAddr))
		}

		user := api.Group("/users")
		user.Use(authMiddleware, userCtxMiddleware)
		{
			user.GET("/me", proxyTo(cfg.Services.UserSvcAddr))
			user.PUT("/me", proxyTo(cfg.Services.UserSvcAddr))
		}

		fav := api.Group("/favorites")
		fav.Use(authMiddleware, userCtxMiddleware)
		{
			fav.POST("", proxyTo(cfg.Services.UserSvcAddr))
			fav.GET("", proxyTo(cfg.Services.UserSvcAddr))
			fav.DELETE("/:id", proxyTo(cfg.Services.UserSvcAddr))
		}

		api.POST("/dramas/:id/comments", authMiddleware, userCtxMiddleware, proxyTo(cfg.Services.UserSvcAddr))
		api.GET("/dramas/:id/comments", proxyTo(cfg.Services.UserSvcAddr))
		api.DELETE("/comments/:id", authMiddleware, userCtxMiddleware, proxyTo(cfg.Services.UserSvcAddr))
		api.POST("/comments/:id/like", authMiddleware, userCtxMiddleware, proxyTo(cfg.Services.UserSvcAddr))

		// Content — read (public or per-route auth handled downstream)
		api.GET("/dramas", proxyTo(cfg.Services.ContentSvcAddr))
		api.GET("/dramas/:id", proxyTo(cfg.Services.ContentSvcAddr))
		api.GET("/dramas/:id/episodes", proxyTo(cfg.Services.ContentSvcAddr))
		api.GET("/episodes/:id", authMiddleware, proxyTo(cfg.Services.ContentSvcAddr))
		api.GET("/episodes/:id/play", authMiddleware, proxyTo(cfg.Services.ContentSvcAddr))
		api.GET("/categories", proxyTo(cfg.Services.ContentSvcAddr))

		// Content — write (auth + forward user context)
		contentWrite := api.Group("")
		contentWrite.Use(authMiddleware, userCtxMiddleware)
		{
			contentWrite.POST("/dramas", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.PUT("/dramas/:id", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.DELETE("/dramas/:id", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.PUT("/dramas/:id/status", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.POST("/dramas/:id/episodes", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.PUT("/episodes/:id", proxyTo(cfg.Services.ContentSvcAddr))
			contentWrite.DELETE("/episodes/:id", proxyTo(cfg.Services.ContentSvcAddr))
		}

		// Video
		video := api.Group("/videos")
		video.Use(authMiddleware)
		{
			video.POST("/upload-url", proxyTo(cfg.Services.VideoSvcAddr))
			video.POST("/multipart/init", proxyTo(cfg.Services.VideoSvcAddr))
			video.POST("/multipart/complete", proxyTo(cfg.Services.VideoSvcAddr))
			video.POST("/upload/complete", proxyTo(cfg.Services.VideoSvcAddr))
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

	// Internal API — for AI Worker calls
	internalKey := middleware.InternalAPIKey(cfg.InternalApiKey)
	internal := r.Group("/internal")
	internal.Use(internalKey)
	{
		internal.GET("/ai/jobs", proxyTo(cfg.Services.ContentSvcAddr))
		internal.PUT("/ai/jobs/:id/status", proxyTo(cfg.Services.ContentSvcAddr))
		internal.GET("/episodes/:id", proxyTo(cfg.Services.ContentSvcAddr))
		internal.PUT("/episodes/:id/localization", proxyTo(cfg.Services.ContentSvcAddr))
	}

	return r
}

// oauthNotImplemented returns a 501 Not Implemented response for OAuth endpoints
// that are not yet implemented in the user service.
func oauthNotImplemented(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusNotImplemented, gin.H{
		"code":    501,
		"message": "OAuth login is not yet implemented. Please use email/password login.",
		"data":    nil,
	})
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

// proxyToMinIO streams files from MinIO through the gateway.
// Path format: /files/{bucket}/{objectKey}
// Uses MinIO SDK credentials so the bucket can remain private.
// Supports HTTP Range requests for video seeking.
func proxyToMinIO(minioClient *minio.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse path: /files/{bucket}/{objectKey...}
		filePath := strings.TrimPrefix(c.Request.URL.Path, "/files/")
		parts := strings.SplitN(filePath, "/", 2)
		if len(parts) != 2 {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid path, expected /files/{bucket}/{object}"})
			return
		}
		bucket := parts[0]
		objectKey := parts[1]

		// Stat the object first to get size and content type
		stat, err := minioClient.StatObject(c.Request.Context(), bucket, objectKey, minio.StatObjectOptions{})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "file not found"})
			return
		}

		opts := minio.GetObjectOptions{}
		var rangeStart, rangeEnd int64
		rangeEnd = stat.Size - 1

		// Handle Range request
		rangeHeader := c.GetHeader("Range")
		if rangeHeader != "" {
			// Parse "bytes=start-end" format
			if _, err := fmt.Sscanf(rangeHeader, "bytes=%d-%d", &rangeStart, &rangeEnd); err != nil {
				// Try open-ended range: "bytes=start-"
				if _, err := fmt.Sscanf(rangeHeader, "bytes=%d-", &rangeStart); err != nil {
					c.AbortWithStatusJSON(http.StatusRequestedRangeNotSatisfiable, gin.H{"error": "invalid range"})
					return
				}
				rangeEnd = stat.Size - 1
			}
			if rangeStart > rangeEnd || rangeStart >= stat.Size {
				c.AbortWithStatusJSON(http.StatusRequestedRangeNotSatisfiable, gin.H{"error": "range not satisfiable"})
				return
			}
			opts.SetRange(rangeStart, rangeEnd)
		}

		obj, err := minioClient.GetObject(c.Request.Context(), bucket, objectKey, opts)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "file not found"})
			return
		}
		defer obj.Close()

		c.Header("Content-Type", stat.ContentType)
		c.Header("Accept-Ranges", "bytes")

		if rangeHeader != "" {
			contentLength := rangeEnd - rangeStart + 1
			c.Header("Content-Length", strconv.FormatInt(contentLength, 10))
			c.Header("Content-Range", fmt.Sprintf("bytes %d-%d/%d", rangeStart, rangeEnd, stat.Size))
			c.Status(http.StatusPartialContent)
		} else {
			c.Header("Content-Length", strconv.FormatInt(stat.Size, 10))
			c.Status(http.StatusOK)
		}

		// For HEAD requests, only headers matter — skip body copy
		if c.Request.Method != http.MethodHead {
			io.Copy(c.Writer, obj)
		}
	}
}
