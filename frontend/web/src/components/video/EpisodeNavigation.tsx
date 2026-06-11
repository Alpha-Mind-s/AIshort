"use client";

import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Episode } from "@/lib/api/drama";

interface EpisodeNavigationProps {
  currentEpisodeId: number;
  episodes: Episode[];
  dramaId: number;
}

export function EpisodeNavigation({
  currentEpisodeId,
  episodes,
  dramaId,
}: EpisodeNavigationProps) {
  const t = useTranslations("player");
  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no);
  const currentIdx = sorted.findIndex((e) => e.id === currentEpisodeId);
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const next =
    currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  return (
    <div className="space-y-3">
      {/* Prev / Next row */}
      <div className="flex items-center justify-between gap-2">
        {prev && prev.status === "ready" ? (
          <Link
            href={`/drama/${dramaId}/watch/${prev.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t("prev_episode")}</span>
          </Link>
        ) : (
          <div />
        )}
        {next && next.status === "ready" ? (
          <Link
            href={`/drama/${dramaId}/watch/${next.id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{t("next_episode")}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Episode list */}
      <details className="group">
        <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          {t("episode_list")} ({episodes.length})
        </summary>
        <div className="mt-2 space-y-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card p-2">
          {sorted.map((ep) => (
            <Link
              key={ep.id}
              href={`/drama/${dramaId}/watch/${ep.id}`}
              className={`flex items-center justify-between rounded px-3 py-2 text-sm transition-colors hover:bg-muted ${
                ep.id === currentEpisodeId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              } ${ep.status !== "ready" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <span>
                Ep. {ep.episode_no} — {ep.title}
              </span>
              {ep.id === currentEpisodeId && (
                <span className="text-xs text-primary">▶ Now</span>
              )}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
