"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { formatDuration } from "@/lib/utils/format";
import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Episode } from "@/lib/api/drama";

interface EpisodeListProps {
  episodes: Episode[];
  dramaId: number;
}

export function EpisodeList({ episodes, dramaId }: EpisodeListProps) {
  const t = useTranslations("drama");
  return (
    <div className="space-y-2">
      {episodes.map((ep) => (
        <Link
          key={ep.id}
          href={`/drama/${dramaId}/watch/${ep.id}`}
          className={cn(
            "flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors group",
            ep.status !== "ready" && "opacity-50 pointer-events-none"
          )}
        >
          {/* Episode number */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <span className="text-sm font-bold">{ep.episode_no}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{ep.title}</h4>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(ep.duration)}
              </span>
              {ep.localizations?.length > 0 && (
                <span>{t("languages_count", { count: ep.localizations.length })}</span>
              )}
            </div>
          </div>

          {/* Status / CTA */}
          <div className="flex-shrink-0">
            {ep.status === "ready" ? (
              <span className="flex items-center gap-1 text-sm text-primary font-medium">
                <Play className="h-4 w-4" fill="currentColor" />
                <span className="hidden sm:inline">{t("watch")}</span>
              </span>
            ) : ep.status === "processing" ? (
              <span className="text-xs text-yellow-500 font-medium">{t("processing")}</span>
            ) : (
              <span className="text-xs text-destructive font-medium">{t("failed")}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
