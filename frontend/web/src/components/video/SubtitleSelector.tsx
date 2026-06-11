"use client";

import { useTranslations } from "next-intl";
import { usePlayerStore } from "@/stores/player-store";
import { cn } from "@/lib/utils/cn";
import { Subtitles } from "lucide-react";
import { useState } from "react";

interface SubtitleOption {
  language: string;
  label: string;
}

interface SubtitleSelectorProps {
  availableSubtitles: SubtitleOption[];
}

export function SubtitleSelector({
  availableSubtitles,
}: SubtitleSelectorProps) {
  const t = useTranslations("player");
  const { subtitleLanguage, setSubtitleLanguage } = usePlayerStore();
  const [open, setOpen] = useState(false);

  if (availableSubtitles.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        aria-label={t("subtitles")}
      >
        <Subtitles className="h-3 w-3" />
        <span>{subtitleLanguage ? subtitleLanguage.toUpperCase() : t("off")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 right-0 z-20 w-28 rounded-md border border-border bg-card shadow-lg py-1">
            <button
              onClick={() => {
                setSubtitleLanguage(null);
                setOpen(false);
              }}
              className={cn(
                "block w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                !subtitleLanguage && "font-medium text-primary bg-primary/5"
              )}
            >
              {t("off")}
              {!subtitleLanguage && <span className="ml-1 text-primary">✓</span>}
            </button>
            {availableSubtitles.map((sub) => (
              <button
                key={sub.language}
                onClick={() => {
                  setSubtitleLanguage(sub.language);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                  subtitleLanguage === sub.language &&
                    "font-medium text-primary bg-primary/5"
                )}
              >
                {sub.label}
                {subtitleLanguage === sub.language && (
                  <span className="ml-1 text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
