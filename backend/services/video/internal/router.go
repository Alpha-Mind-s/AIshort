package internal

import (
	"github.com/gin-gonic/gin"

	"github.com/ai-shot/video-svc/internal/handler"
	svc "github.com/ai-shot/video-svc/internal/service"
)

func SetupRouter(s3Endpoint, s3Bucket, cdnURL string) *gin.Engine {
	r := gin.Default()

	uploadSvc := svc.NewUploadService(s3Endpoint, s3Bucket, cdnURL)
	uploadHandler := handler.NewUploadHandler(uploadSvc)

	api := r.Group("/api/v1")
	{
		video := api.Group("/videos")
		{
			video.POST("/upload-url", uploadHandler.GetUploadURL)
			video.POST("/multipart/init", uploadHandler.InitMultipart)
			video.POST("/multipart/complete", uploadHandler.CompleteMultipart)
		}
	}

	return r
}
