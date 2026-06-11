package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ai-shot/video-svc/internal/model"
)

type UploadService struct {
	s3Endpoint string
	s3Bucket   string
	cdnURL     string
}

func NewUploadService(s3Endpoint, s3Bucket, cdnURL string) *UploadService {
	return &UploadService{s3Endpoint: s3Endpoint, s3Bucket: s3Bucket, cdnURL: cdnURL}
}

func (s *UploadService) GetUploadURL(ctx context.Context, req *model.UploadURLRequest) (*model.UploadURLResponse, error) {
	objectKey := fmt.Sprintf("uploads/%s/%s", uuid.New().String(), req.Filename)

	uploadURL := fmt.Sprintf("%s/%s/%s", s.s3Endpoint, s.s3Bucket, objectKey)
	downloadURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.s3Bucket, objectKey)

	return &model.UploadURLResponse{
		UploadURL:   uploadURL,
		DownloadURL: downloadURL,
		ExpiresAt:   time.Now().Add(1 * time.Hour).Unix(),
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
