import { getTranslations } from "next-intl/server";
import { serverGetEpisodePlay, serverGetDramaEpisodes, serverGetDramaDetail } from "@/lib/mocks/data-access";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { QualitySelector } from "@/components/video/QualitySelector";
import { SubtitleSelector } from "@/components/video/SubtitleSelector";
import { EpisodeNavigation } from "@/components/video/EpisodeNavigation";
import { notFound } from "next/navigation";
import { Clock, Languages } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

interface Props {
  params: Promise<{ id: string; episodeId: string; locale: string }>;
}

export default async function WatchPage({ params }: Props) {
  const { id, episodeId } = await params;
  const t = await getTranslations("player");
  const dramaId = Number(id);
  const epId = Number(episodeId);

  const [playInfo, episodes, drama] = await Promise.all([
    serverGetEpisodePlay(epId),
    serverGetDramaEpisodes(dramaId),
    serverGetDramaDetail(dramaId),
  ]);

  if (!playInfo || !drama) {
    notFound();
  }

  const availableSubtitles = playInfo.episode.localizations
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
            <span className="text-zinc-400">{drama.title}</span>
            <span className="text-zinc-600">/</span>
            <span>
              Ep. {playInfo.episode.episode_no}: {playInfo.episode.title}
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
              {formatDuration(playInfo.episode.duration)}
            </span>
            {availableSubtitles.length > 0 && (
              <span className="flex items-center gap-1">
                <Languages className="h-4 w-4" />
                {availableSubtitles.length} {t("subtitles").toLowerCase()}
              </span>
            )}
          </div>

          <EpisodeNavigation
            currentEpisodeId={epId}
            episodes={episodes}
            dramaId={dramaId}
          />
        </div>
      </div>
    </div>
  );
}
