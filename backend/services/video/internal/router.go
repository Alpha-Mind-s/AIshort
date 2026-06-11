package internal

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	"github.com/ai-shot/video-svc/internal/handler"
	svc "github.com/ai-shot/video-svc/internal/service"
)

func SetupRouter(pool *pgxpool.Pool, rdb *redis.Client, s3Endpoint, s3AccessKey, s3SecretKey, s3Bucket, cdnURL string, useSSL bool) (*gin.Engine, error) {
	uploadSvc, err := svc.NewUploadService(s3Endpoint, s3AccessKey, s3SecretKey, s3Bucket, cdnURL, useSSL, rdb)
	if err != nil {
		return nil, err
	}

	uploadRepo := svc.NewUploadRepo(pool)
	uploadHandler := handler.NewUploadHandler(uploadSvc, uploadRepo)

	r := gin.Default()
	api := r.Group("/api/v1")
	{
		video := api.Group("/videos")
		{
			video.POST("/upload-url", uploadHandler.GetUploadURL)
			video.POST("/multipart/init", uploadHandler.InitMultipart)
			video.POST("/multipart/complete", uploadHandler.CompleteMultipart)
			video.POST("/upload/complete", uploadHandler.CompleteUpload)
			video.GET("/:id/tasks", uploadHandler.GetTasks)
		}
	}

	return r, nil
}
