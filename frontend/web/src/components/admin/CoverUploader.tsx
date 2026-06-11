"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface CoverUploaderProps {
  value?: string;
  onChange: (coverUrl: string) => void;
}

export function CoverUploader({ value, onChange }: CoverUploaderProps) {
  const t = useTranslations("admin");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      setError("");

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(file.type)) {
        setError("Unsupported image format. Use JPG, PNG, or WebP.");
        return;
      }
      if (file.size > maxSize) {
        setError("Image too large. Maximum size is 5 MB.");
        return;
      }

      // In mock mode, create a local object URL for preview
      // and pass a placeholder URL as the "uploaded" cover
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Use picsum with a random seed as mock cover URL
      const mockUrl = `https://picsum.photos/seed/${Date.now()}/400/600`;
      onChange(mockUrl);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
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

  if (preview) {
    return (
      <div className="relative inline-block">
        <div className="relative w-36 h-48 rounded-lg overflow-hidden border border-border">
          <Image
            src={preview}
            alt="Cover preview"
            fill
            sizes="144px"
            className="object-cover"
          />
        </div>
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            type="button"
            onClick={handleClick}
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs hover:opacity-90 transition-opacity"
          >
            <Upload className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:opacity-90 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "w-36 h-48 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50",
          "flex flex-col items-center justify-center gap-2 cursor-pointer",
          "transition-colors bg-muted/20 hover:bg-muted/30"
        )}
      >
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground text-center px-2">
          {t("image_formats")}
        </p>
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
