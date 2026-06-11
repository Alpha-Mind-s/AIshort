package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"github.com/ai-shot/video-svc/internal/model"
)

type UploadService struct {
	minioClient *minio.Client
	bucket      string
	cdnURL      string
	sessions    sync.Map
}

func NewUploadService(endpoint, accessKey, secretKey, bucket, cdnURL string, useSSL bool) (*UploadService, error) {
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("create minio client: %w", err)
	}

	return &UploadService{
		minioClient: minioClient,
		bucket:      bucket,
		cdnURL:      cdnURL,
	}, nil
}

func (s *UploadService) GetUploadURL(ctx context.Context, req *model.UploadURLRequest) (*model.UploadURLResponse, error) {
	objectKey := fmt.Sprintf("uploads/%s/%s", uuid.New().String(), req.Filename)

	presignedURL, err := s.minioClient.PresignedPutObject(ctx, s.bucket, objectKey, 1*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("presign upload url: %w", err)
	}

	uploadID := uuid.New().String()
	downloadURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.bucket, objectKey)

	s.sessions.Store(uploadID, &model.UploadSession{
		UploadID:    uploadID,
		ObjectKey:   objectKey,
		Filename:    req.Filename,
		FileSize:    req.FileSize,
		ContentType: req.ContentType,
		CreatedAt:   time.Now(),
	})

	return &model.UploadURLResponse{
		UploadURL:   presignedURL.String(),
		DownloadURL: downloadURL,
		ExpiresIn:   3600,
	}, nil
}

func (s *UploadService) CompleteUpload(ctx context.Context, repo *UploadRepo, req *model.UploadCompleteRequest) (*model.UploadCompleteResponse, error) {
	videoURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.bucket, req.UploadID)

	if err := repo.ProcessUpload(ctx, req.EpisodeID, videoURL, req.FileSize, req.Duration); err != nil {
		return nil, fmt.Errorf("process upload complete: %w", err)
	}

	duration := 0
	if req.Duration != nil {
		duration = *req.Duration
	}

	return &model.UploadCompleteResponse{
		VideoURL: videoURL,
		Duration: duration,
		Status:   "ready",
	}, nil
}

func (s *UploadService) InitMultipart(ctx context.Context, req *model.MultipartInitRequest) (*model.MultipartInitResponse, error) {
	partSize := int64(5 * 1024 * 1024)
	parts := int(req.FileSize / partSize)
	if req.FileSize%partSize != 0 {
		parts++
	}

	return &model.MultipartInitResponse{
		UploadID: uuid.New().String(),
		PartSize: partSize,
		Parts:    parts,
	}, nil
}

func (s *UploadService) CompleteMultipart(ctx context.Context, req *model.MultipartCompleteRequest) error {
	return nil
}
