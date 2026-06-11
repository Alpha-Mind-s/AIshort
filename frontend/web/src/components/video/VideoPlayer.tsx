"use client";

import { useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import { usePlayerStore } from "@/stores/player-store";
import type { EpisodePlayInfo } from "@/lib/api/drama";

interface VideoPlayerProps {
  playInfo: EpisodePlayInfo;
}

export function VideoPlayer({ playInfo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const { currentQuality, subtitleLanguage, volume, playbackRate } =
    usePlayerStore();

  // Find current quality URL
  const currentAsset =
    playInfo.qualities.find((q) => q.resolution === currentQuality) ??
    playInfo.qualities[0];
  const videoSrc = currentAsset?.url ?? playInfo.play_url;

  // Build subtitle tracks
  const subtitleTracks = playInfo.episode.localizations
    .filter((loc) => loc.subtitle_url)
    .map((loc) => ({
      kind: "subtitles" as const,
      src: loc.subtitle_url!,
      srclang: loc.language,
      label: loc.language.toUpperCase(),
    }));

  const initPlayer = useCallback(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: false,
      preload: "auto",
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      language: "en",
    });

    player.volume(volume);
    player.playbackRate(playbackRate);

    playerRef.current = player;

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cleanup = initPlayer();
    return () => cleanup?.();
  }, [initPlayer]);

  // Update source when quality changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !videoSrc) return;
    const currentTime = player.currentTime();
    const wasPlaying = !player.paused();
    player.src({ type: "video/mp4", src: videoSrc });
    player.one("loadedmetadata", () => {
      player.currentTime(currentTime);
      if (wasPlaying) player.play();
    });
  }, [videoSrc]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered w-full"
        playsInline
      >
        {subtitleTracks.map((track) => (
          <track
            key={track.srclang}
            kind={track.kind}
            src={track.src}
            srcLang={track.srclang}
            label={track.label}
            default={track.srclang === subtitleLanguage}
          />
        ))}
      </video>
    </div>
  );
}
