import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { VideoQuality } from "@/lib/utils/constants";

interface PlayerState {
  currentQuality: VideoQuality;
  subtitleLanguage: string | null;
  volume: number;
  playbackRate: number;

  setQuality: (q: VideoQuality) => void;
  setSubtitleLanguage: (lang: string | null) => void;
  setVolume: (v: number) => void;
  setPlaybackRate: (rate: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentQuality: "720p",
      subtitleLanguage: null,
      volume: 1,
      playbackRate: 1,

      setQuality: (q) => set({ currentQuality: q }),
      setSubtitleLanguage: (lang) => set({ subtitleLanguage: lang }),
      setVolume: (v) => set({ volume: v }),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),
    }),
    { name: "player-storage" }
  )
);
