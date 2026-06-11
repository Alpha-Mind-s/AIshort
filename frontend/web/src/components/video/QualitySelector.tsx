"use client";

import { useTranslations } from "next-intl";
import { usePlayerStore } from "@/stores/player-store";
import { VIDEO_QUALITIES, type VideoQuality } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { Settings } from "lucide-react";
import { useState } from "react";

interface QualitySelectorProps {
  availableQualities: string[];
}

export function QualitySelector({ availableQualities }: QualitySelectorProps) {
  const t = useTranslations("player");
  const { currentQuality, setQuality } = usePlayerStore();
  const [open, setOpen] = useState(false);

  const options = VIDEO_QUALITIES.filter((q) =>
    availableQualities.includes(q)
  );

  if (options.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
        aria-label={t("quality")}
      >
        <Settings className="h-3 w-3" />
        <span>{currentQuality}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 right-0 z-20 w-28 rounded-md border border-border bg-card shadow-lg py-1">
            {options.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuality(q);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                  currentQuality === q && "font-medium text-primary bg-primary/5"
                )}
              >
                {q}
                {currentQuality === q && (
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
