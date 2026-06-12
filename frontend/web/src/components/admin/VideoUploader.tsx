"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Upload, FileVideo, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getUploadUrl } from "@/lib/api/drama";

export interface UploadInfo {
  upload_id: string;
  download_url: string;
  file_size: number;
  content_type: string;
}

interface VideoUploaderProps {
  value?: string; // current video_url
  onChange: (uploadInfo: UploadInfo) => void;
}

type UploadPhase = "idle" | "selecting" | "uploading" | "done" | "error";

export function VideoUploader({ value, onChange }: VideoUploaderProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>(value ? "done" : "idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [error, setError] = useState("");

  const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
  const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return "Unsupported video format. Use MP4, MOV, or WebM.";
      }
      if (file.size > maxSize) {
        return "File too large. Maximum size is 2 GB.";
      }
      return null;
    },
    []
  );

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setPhase("error");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setError("");
      setPhase("uploading");
      setProgress(0);

      try {
        // 1. Get presigned upload URL from backend
        const uploadInfo = await getUploadUrl({
          filename: file.name,
          file_size: file.size,
          content_type: file.type,
        });

        // 2. Real XHR upload to MinIO via presigned URL with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadInfo.upload_url);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        // 3. Notify parent with upload info (completeUpload is called after episode creation)
        onChange({
          upload_id: uploadInfo.upload_id,
          download_url: uploadInfo.download_url,
          file_size: file.size,
          content_type: file.type,
        });
        setPhase("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("error");
      }
    },
    [validateFile, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPhase("idle");
    setProgress(0);
    setFileName("");
    setFileSize(0);
    setError("");
    onChange({ upload_id: "", download_url: "", file_size: 0, content_type: "" });
  };

  function formatSize(bytes: number): string {
    if (bytes === 0) return "";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  }

  // ---- done state ----
  if (phase === "done" && value) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || "video.mp4"}</p>
            <p className="text-xs text-muted-foreground">{t("upload_success")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="text-xs text-primary hover:opacity-80 transition-opacity"
            >
              {t("change_video")}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  // ---- uploading state ----
  if (phase === "uploading") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <FileVideo className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">{formatSize(fileSize)}</p>
          </div>
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">{t("uploading")}</p>
      </div>
    );
  }

  // ---- error state ----
  if (phase === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase("idle");
            setError("");
          }}
          className="text-xs text-primary hover:opacity-80 transition-opacity"
        >
          {tc("retry")}
        </button>
      </div>
    );
  }

  // ---- idle state ----
  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 p-8",
        "flex flex-col items-center justify-center gap-3 cursor-pointer",
        "transition-colors bg-muted/20 hover:bg-muted/30"
      )}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{t("drag_drop")}</p>
        <p className="text-xs text-muted-foreground">{t("file_formats")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
