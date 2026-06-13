"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getFileUploadUrl } from "@/lib/api/files";

interface AvatarUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  nickname: string;
  onUploading?: (uploading: boolean) => void;
}

export function AvatarUploader({ value, onChange, nickname, onUploading }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const setUploadingState = useCallback(
    (v: boolean) => {
      setUploading(v);
      onUploading?.(v);
    },
    [onUploading]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(file.type)) {
        setError("Unsupported format. Use JPG, PNG, or WebP.");
        return;
      }
      if (file.size > maxSize) {
        setError("Image too large. Maximum size is 5 MB.");
        return;
      }

      // Show local preview immediately (blob URL — works offline)
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setUploadingState(true);

      try {
        // 1. Get presigned upload URL from gateway
        const uploadRes = await getFileUploadUrl({
          filename: file.name,
          content_type: file.type,
        });

        // 2. XHR upload to MinIO via presigned URL
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadRes.upload_url);
          xhr.setRequestHeader("Content-Type", file.type);

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

        // 3. Return the download URL to parent
        onChange(uploadRes.download_url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        setPreview(null);
      } finally {
        setUploadingState(false);
      }
    },
    [onChange, setUploadingState]
  );

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
  };

  // Image source: local blob during/after upload, otherwise the public URL
  const imgSrc = preview || value;

  // --- with avatar image ---
  if (imgSrc) {
    return (
      <div className="relative inline-block">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border border-border">
          <img
            src={imgSrc}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
        {error && <p className="text-xs text-destructive mt-1 text-center">{error}</p>}
      </div>
    );
  }

  // --- fallback: initial letter + upload button ---
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center",
          "text-2xl font-bold text-primary",
          "hover:bg-primary/20 transition-colors group cursor-pointer",
          "border-2 border-dashed border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <span className="group-hover:opacity-30 transition-opacity">
          {nickname.charAt(0).toUpperCase()}
        </span>
        <Camera className="absolute h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <span className="text-xs text-muted-foreground">Change Photo</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
