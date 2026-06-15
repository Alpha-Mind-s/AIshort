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

/** Backend business error code for "subscription required" */
const ERR_SUBSCRIPTION_REQUIRED = 40003;

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
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);

  const currentEpiNo = episodeNo ?? 1;
  const isFirstEpisode = currentEpiNo <= 1;

  // Fetch play URL.
  // Episode 1 is free — if backend rejects it, fall back to direct video_url
  // from the episodes list (RequireSubscription middleware currently gates all).
  useEffect(() => {
    getEpisodePlay(episodeId)
      .then(setPlayInfo)
      .catch((err: unknown) => {
        // Duck-type: instanceof ApiError fails across webpack module boundaries
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: number }).code === ERR_SUBSCRIPTION_REQUIRED
        ) {
          if (isFirstEpisode) {
            const ep = episodes.find((e) => e.id === episodeId);
            if (ep?.video_url) {
              setPlayInfo({
                episode: ep,
                play_url: ep.video_url,
                expires_at: "",
                qualities: [],
              });
              return;
            }
          }
          setPaymentRequired(true);
        } else {
          setError(err instanceof Error ? err.message : t("failed_to_load"));
        }
      });

    // Fetch subscription for episode 2+ gating
    if (!isFirstEpisode) {
      getSubscriptionStatus()
        .then((sub) => setSubscription(sub))
        .catch(() => setSubscription(null));
    }
  }, [episodeId, t, isFirstEpisode, episodes]);

  // ── Render ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <p className="text-red-400 text-lg">{t("failed_to_load")}</p>
          <p className="text-zinc-400 text-sm break-all">{error}</p>
        </div>
      </div>
    );
  }

  // Paywall: either play API said 40003, or no subscription for episode 2+
  if (paymentRequired || (!isFirstEpisode && subscription === null)) {
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

  // Loading
  if (!playInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
