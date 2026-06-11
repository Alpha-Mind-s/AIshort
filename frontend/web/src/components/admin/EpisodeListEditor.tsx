"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import type { Episode } from "@/lib/api/drama";

interface EpisodeListEditorProps {
  episodes: Episode[];
  dramaId: number;
  onDelete: (episodeId: number) => void;
  isDeleting?: number | null; // episode id currently being deleted
}

export function EpisodeListEditor({
  episodes,
  dramaId,
  onDelete,
  isDeleting,
}: EpisodeListEditorProps) {
  const t = useTranslations("admin");

  if (episodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">{t("no_episodes")}</p>
      </div>
    );
  }

  const sorted = [...episodes].sort((a, b) => a.episode_no - b.episode_no);

  return (
    <div className="space-y-2">
      {sorted.map((ep) => (
        <div
          key={ep.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 group hover:border-primary/30 transition-colors"
        >
          {/* Drag handle (visual only — no actual drag in MVP) */}
          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />

          {/* Episode info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                EP {ep.episode_no}
              </span>
              <h4 className="text-sm font-medium truncate">{ep.title}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatDuration(ep.duration)}</span>
              <span
                className={`capitalize ${
                  ep.status === "ready"
                    ? "text-green-500"
                    : ep.status === "processing"
                    ? "text-yellow-500"
                    : "text-destructive"
                }`}
              >
                {ep.status}
              </span>
              <span>{ep.localizations.length} languages</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Link
              href={`/admin/content/${dramaId}/episodes/${ep.id}/edit`}
              className="p-1.5 hover:bg-muted rounded transition-colors"
              title={t("edit_episode")}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(ep.id)}
              disabled={isDeleting === ep.id}
              className="p-1.5 hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
              title={t("delete_drama")}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
