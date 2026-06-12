package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"

	"github.com/ai-shot/pkg/logger"
	"github.com/ai-shot/video-svc/internal/model"
)

const (
	sessionTTL    = 24 * time.Hour
	sessionPrefix = "upload_session:"
)

// allowedVideoTypes defines MIME types accepted for video upload.
var allowedVideoTypes = map[string]bool{
	"video/mp4":            true, // .mp4
	"video/quicktime":      true, // .mov
	"video/x-matroska":     true, // .mkv
	"video/x-msvideo":      true, // .avi
	"video/webm":           true, // .webm
}

type UploadService struct {
	minioClient *minio.Client
	bucket      string
	cdnURL      string
	rdb         *redis.Client
	transcode   *TranscodeService
}

func NewUploadService(endpoint, accessKey, secretKey, bucket, cdnURL string, useSSL bool, rdb *redis.Client) (*UploadService, error) {
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
		rdb:         rdb,
		transcode:   NewTranscodeService(minioClient, bucket),
	}, nil
}

// saveSession stores an upload session in Redis with TTL.
func (s *UploadService) saveSession(ctx context.Context, session *model.UploadSession) error {
	data, err := json.Marshal(session)
	if err != nil {
		return fmt.Errorf("marshal session: %w", err)
	}
	return s.rdb.Set(ctx, sessionPrefix+session.UploadID, data, sessionTTL).Err()
}

// loadSession retrieves an upload session from Redis.
func (s *UploadService) loadSession(ctx context.Context, uploadID string) (*model.UploadSession, error) {
	data, err := s.rdb.Get(ctx, sessionPrefix+uploadID).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("upload session not found: %s", uploadID)
		}
		return nil, fmt.Errorf("get session: %w", err)
	}
	var session model.UploadSession
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, fmt.Errorf("unmarshal session: %w", err)
	}
	return &session, nil
}

// deleteSession removes an upload session from Redis after completion.
func (s *UploadService) deleteSession(ctx context.Context, uploadID string) {
	s.rdb.Del(ctx, sessionPrefix+uploadID)
}

func (s *UploadService) GetUploadURL(ctx context.Context, req *model.UploadURLRequest) (*model.UploadURLResponse, error) {
	objectKey := fmt.Sprintf("uploads/%s/%s", uuid.New().String(), req.Filename)

	presignedURL, err := s.minioClient.PresignedPutObject(ctx, s.bucket, objectKey, 1*time.Hour)
	if err != nil {
		return nil, fmt.Errorf("presign upload url: %w", err)
	}

	uploadID := uuid.New().String()
	downloadURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.bucket, objectKey)

	session := &model.UploadSession{
		UploadID:    uploadID,
		ObjectKey:   objectKey,
		Filename:    req.Filename,
		FileSize:    req.FileSize,
		ContentType: req.ContentType,
		CreatedAt:   time.Now(),
	}
	if err := s.saveSession(ctx, session); err != nil {
		return nil, fmt.Errorf("save session: %w", err)
	}

	return &model.UploadURLResponse{
		UploadID:    uploadID,
		UploadURL:   presignedURL.String(),
		DownloadURL: downloadURL,
		ExpiresIn:   3600,
	}, nil
}

func (s *UploadService) CompleteUpload(ctx context.Context, repo *UploadRepo, req *model.UploadCompleteRequest) (*model.UploadCompleteResponse, error) {
	session, err := s.loadSession(ctx, req.UploadID)
	if err != nil {
		return nil, err
	}

	// Validate file format — only accept video MIME types.
	normalized := strings.ToLower(strings.TrimSpace(session.ContentType))
	// Strip parameters (e.g. "video/mp4; codecs=...") — keep only the base type.
	if idx := strings.Index(normalized, ";"); idx != -1 {
		normalized = strings.TrimSpace(normalized[:idx])
	}
	if !allowedVideoTypes[normalized] {
		return nil, fmt.Errorf("unsupported file type: %s (allowed: mp4, mov, mkv, avi, webm)", session.ContentType)
	}

	videoURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.bucket, session.ObjectKey)

	// Process the upload: update episode status, create AI jobs
	if err := repo.ProcessUpload(ctx, req.EpisodeID, videoURL, req.FileSize, req.Duration); err != nil {
		return nil, fmt.Errorf("process upload complete: %w", err)
	}

	// Clean up the session
	s.deleteSession(ctx, req.UploadID)

	duration := 0
	if req.Duration != nil {
		duration = *req.Duration
	}

	// Async transcode to H.264+AAC for browser compatibility
	sourceKey := session.ObjectKey
	episodeID := req.EpisodeID
	cdnURL := s.cdnURL
	bucket := s.bucket
	go func() {
		bgCtx := context.Background()
		newKey, err := s.transcode.Transcode(bgCtx, sourceKey, episodeID)
		if err != nil {
			logger.Error().Err(err).
				Int64("episode_id", episodeID).
				Str("source_key", sourceKey).
				Msg("transcode failed — keeping original video")
			return
		}

		transcodedURL := fmt.Sprintf("%s/%s/%s", cdnURL, bucket, newKey)
		if err := repo.UpdateEpisodeURL(bgCtx, episodeID, transcodedURL); err != nil {
			logger.Error().Err(err).
				Int64("episode_id", episodeID).
				Str("transcoded_url", transcodedURL).
				Msg("failed to update episode URL after transcode")
			return
		}

		logger.Info().
			Int64("episode_id", episodeID).
			Str("new_url", transcodedURL).
			Msg("episode updated with transcoded video URL")
	}()

	return &model.UploadCompleteResponse{
		VideoURL: videoURL,
		Duration: duration,
		Status:   "ready",
	}, nil
}

// InitMultipart creates a multipart upload session stored in Redis.
// The client receives part count/size info and uploads parts via presigned
// single-upload URLs (one per part) or the AWS/MinIO SDK.
// For files under 5 GB, prefer the single-upload flow (GetUploadURL).
func (s *UploadService) InitMultipart(ctx context.Context, req *model.MultipartInitRequest) (*model.MultipartInitResponse, error) {
	objectKey := fmt.Sprintf("uploads/%s/%s", uuid.New().String(), req.Filename)
	uploadID := uuid.New().String()

	partSize := int64(5 * 1024 * 1024) // 5MB minimum part size
	totalParts := int(req.FileSize / partSize)
	if req.FileSize%partSize != 0 {
		totalParts++
	}

	// Store session in Redis for later completion
	session := &model.UploadSession{
		UploadID:    uploadID,
		ObjectKey:   objectKey,
		Filename:    req.Filename,
		FileSize:    req.FileSize,
		ContentType: req.ContentType,
		CreatedAt:   time.Now(),
	}
	if err := s.saveSession(ctx, session); err != nil {
		return nil, fmt.Errorf("save session: %w", err)
	}

	downloadURL := fmt.Sprintf("%s/%s/%s", s.cdnURL, s.bucket, objectKey)

	return &model.MultipartInitResponse{
		UploadID:    uploadID,
		PartSize:    partSize,
		Parts:       totalParts,
		DownloadURL: downloadURL,
	}, nil
}

// CompleteMultipart validates the session and cleans up after a multipart upload.
// In this MVP, the client uploads parts via individual presigned PUT URLs
// (one GetUploadURL call per part), then calls CompleteMultipart to finalize.
func (s *UploadService) CompleteMultipart(ctx context.Context, req *model.MultipartCompleteRequest) error {
	_, err := s.loadSession(ctx, req.UploadID)
	if err != nil {
		return err
	}

	// In MVP mode, parts were uploaded individually via presigned URLs.
	// The object is already assembled in MinIO. Just clean up the session.
	s.deleteSession(ctx, req.UploadID)
	return nil
}
