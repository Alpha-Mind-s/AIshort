"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Clock, Languages, Lock } from "lucide-react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { QualitySelector } from "@/components/video/QualitySelector";
import { SubtitleSelector } from "@/components/video/SubtitleSelector";
import { EpisodeNavigation } from "@/components/video/EpisodeNavigation";
import { BackButton } from "@/components/ui/BackButton";
import { getEpisodePlay } from "@/lib/api/drama";
import type { Episode, EpisodePlayInfo } from "@/lib/api/drama";
import { getSubscriptionStatus, type Subscription } from "@/lib/api/subscriptions";
import { formatDuration } from "@/lib/utils/format";

interface Props {
  episodeId: number;
  dramaId: number;
  dramaTitle: string;
  episodeNo?: number;
  episodeTitle?: string;
  episodeDuration?: number | null;
  episodes: Episode[];
  locale: string;
}

export function WatchPageClient({
  episodeId,
  dramaId,
  dramaTitle,
  episodeNo,
  episodeTitle,
  episodeDuration,
  episodes,
  locale,
}: Props) {
  const t = useTranslations("player");
  const router = useRouter();
  const [playInfo, setPlayInfo] = useState<EpisodePlayInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [checkingSub, setCheckingSub] = useState(true);

  useEffect(() => {
    getEpisodePlay(episodeId)
      .then(setPlayInfo)
      .catch((err) => setError(err instanceof Error ? err.message : t("failed_to_load")));
  }, [episodeId]);

  // Check subscription for episode 2+ gating
  useEffect(() => {
    const epNo = episodeNo ?? playInfo?.episode?.episode_no ?? 1;
    if (epNo <= 1) {
      setCheckingSub(false);
      return;
    }
    getSubscriptionStatus()
      .then((sub) => setSubscription(sub))
      .catch(() => setSubscription(null))
      .finally(() => setCheckingSub(false));
  }, [episodeNo, playInfo]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{t("failed_to_load")}</p>
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (checkingSub || !playInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentEpiNo = episodeNo ?? playInfo.episode.episode_no ?? 1;
  const needsSubscription = currentEpiNo > 1 && !subscription;

  if (needsSubscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <Lock className="h-12 w-12 text-zinc-500 mx-auto" />
          <div className="space-y-2">
            <p className="text-white text-xl font-semibold">{t("subscribe_to_watch")}</p>
            <p className="text-zinc-400 text-sm">
              {t("first_episode_free")}
            </p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/subscribe`)}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t("view_plans")}
          </button>
        </div>
      </div>
    );
  }

  const availableSubtitles = (playInfo.episode.localizations ?? [])
    .filter((loc) => loc.subtitle_url)
    .map((loc) => ({
      language: loc.language,
      label: loc.language.toUpperCase(),
    }));

  const availableQualities = playInfo.qualities.map((q) => q.resolution);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Video Player */}
        <VideoPlayer playInfo={playInfo} />

        {/* Controls bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white text-sm font-medium truncate">
            <BackButton
              fallbackHref={`/drama/${dramaId}`}
              className="text-zinc-400 hover:text-white mr-1"
            />
            <span className="text-zinc-400">{dramaTitle}</span>
            <span className="text-zinc-600">/</span>
            <span>
              Ep. {episodeNo ?? playInfo.episode.episode_no}:{" "}
              {episodeTitle ?? playInfo.episode.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <QualitySelector availableQualities={availableQualities} />
            <SubtitleSelector availableSubtitles={availableSubtitles} />
          </div>
        </div>

        {/* Episode info + Navigation */}
        <div className="px-4 py-4 bg-zinc-900 text-white space-y-4">
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(episodeDuration ?? playInfo.episode.duration)}
            </span>
            {availableSubtitles.length > 0 && (
              <span className="flex items-center gap-1">
                <Languages className="h-4 w-4" />
                {availableSubtitles.length} {t("subtitles").toLowerCase()}
              </span>
            )}
          </div>

          <EpisodeNavigation
            currentEpisodeId={episodeId}
            episodes={episodes}
            dramaId={dramaId}
          />
        </div>
      </div>
    </div>
  );
}
