package service

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/minio/minio-go/v7"

	"github.com/ai-shot/pkg/logger"
)

// TranscodeService transcodes uploaded videos to H.264+AAC for browser compatibility.
type TranscodeService struct {
	minioClient *minio.Client
	bucket      string
}

// NewTranscodeService creates a new transcode service.
func NewTranscodeService(minioClient *minio.Client, bucket string) *TranscodeService {
	return &TranscodeService{minioClient: minioClient, bucket: bucket}
}

// Transcode downloads a source video from MinIO, transcodes it to H.264+AAC with
// faststart, uploads the result, and returns the new object key.
func (s *TranscodeService) Transcode(ctx context.Context, sourceKey string, episodeID int64) (string, error) {
	tmpDir, err := os.MkdirTemp("", "transcode-*")
	if err != nil {
		return "", fmt.Errorf("create temp dir: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	inputPath := filepath.Join(tmpDir, "input.mp4")
	outputPath := filepath.Join(tmpDir, "output.mp4")

	// 1. Download source from MinIO
	if err := s.download(ctx, sourceKey, inputPath); err != nil {
		return "", fmt.Errorf("download source: %w", err)
	}

	// 2. Transcode: H.264 High Profile + AAC audio + faststart for streaming
	if err := s.runFFmpeg(inputPath, outputPath); err != nil {
		return "", fmt.Errorf("ffmpeg transcode: %w", err)
	}

	// 3. Upload result to MinIO
	destKey := fmt.Sprintf("videos/%d/transcoded.mp4", episodeID)
	if err := s.upload(ctx, destKey, outputPath); err != nil {
		return "", fmt.Errorf("upload transcoded: %w", err)
	}

	logger.Info().
		Int64("episode_id", episodeID).
		Str("source_key", sourceKey).
		Str("dest_key", destKey).
		Msg("transcode complete")

	return destKey, nil
}

func (s *TranscodeService) download(ctx context.Context, key, destPath string) error {
	obj, err := s.minioClient.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return err
	}
	defer obj.Close()

	f, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.ReadFrom(obj); err != nil {
		return err
	}
	return nil
}

func (s *TranscodeService) runFFmpeg(inputPath, outputPath string) error {
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-c:v", "libx264",
		"-profile:v", "high",
		"-preset", "medium",
		"-c:a", "aac",
		"-b:a", "192k",
		"-movflags", "+faststart",
		"-y",
		outputPath,
	)

	// Capture stderr for debugging (ffmpeg writes progress to stderr)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%w: %s", err, string(output))
	}

	return nil
}

func (s *TranscodeService) upload(ctx context.Context, key, sourcePath string) error {
	f, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return err
	}

	_, err = s.minioClient.PutObject(ctx, s.bucket, key, f, stat.Size(), minio.PutObjectOptions{
		ContentType: "video/mp4",
		// Long cache lifetime — transcoded files are immutable
		UserMetadata: map[string]string{
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	})
	return err
}
