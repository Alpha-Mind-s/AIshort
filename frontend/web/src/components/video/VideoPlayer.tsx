"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "@/stores/player-store";
import type { EpisodePlayInfo } from "@/lib/api/drama";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

interface VideoPlayerProps {
  playInfo: EpisodePlayInfo;
}

export function VideoPlayer({ playInfo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentQuality } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const currentAsset =
    playInfo.qualities.find((q) => q.resolution === currentQuality) ??
    playInfo.qualities[0];
  // Use the gateway/CDN URL directly. The Gateway proxies /files/* to MinIO
  // with proper CORS and Range headers, so no extra proxy is needed.
  const videoSrc = currentAsset?.url ?? playInfo.play_url ?? null;

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setCurrentTime(video.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => setIsPlaying(false), []);

  const handleError = useCallback(() => {
    const video = videoRef.current;
    const msg = video?.error
      ? `MEDIA_ERR_${["UNKNOWN", "ABORTED", "NETWORK", "DECODE", "SRC_NOT_SUPPORTED"][video.error.code] || video.error.code}`
      : "Unknown error";
    console.error("[VideoPlayer] Native video error:", msg, "src:", videoSrc);
    setError(msg);
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    // Reset error on new source
    setError(null);
    video.src = videoSrc;
    video.load();
  }, [videoSrc]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!videoSrc) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden shadow-2xl group">
      {/* Native video element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onClick={togglePlay}
      />

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-2">
            <p className="text-red-400 text-sm font-medium">Video failed to load</p>
            <p className="text-zinc-400 text-xs">{error}</p>
            <p className="text-zinc-500 text-xs truncate max-w-md px-4">{videoSrc}</p>
          </div>
        </div>
      )}

      {/* Custom controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => {
            const video = videoRef.current;
            if (video) video.currentTime = Number(e.target.value);
          }}
          className="w-full h-1 mb-2 appearance-none bg-zinc-600 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="p-1 hover:text-primary transition-colors">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => skip(-10)} className="p-1 hover:text-primary transition-colors">
              <SkipBack className="h-4 w-4" />
            </button>
            <button onClick={() => skip(10)} className="p-1 hover:text-primary transition-colors">
              <SkipForward className="h-4 w-4" />
            </button>
            <span className="text-xs ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="p-1 hover:text-primary transition-colors">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button onClick={toggleFullscreen} className="p-1 hover:text-primary transition-colors">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
