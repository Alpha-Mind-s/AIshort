"use client";

import { useTranslations } from "next-intl";
import { DramaCard } from "./DramaCard";
import type { Drama } from "@/lib/api/drama";

interface DramaGridProps {
  dramas: Drama[];
}

export function DramaGrid({ dramas }: DramaGridProps) {
  const t = useTranslations("drama");

  if (dramas.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">{t("no_dramas")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
      {dramas.map((drama) => (
        <DramaCard key={drama.id} drama={drama} />
      ))}
    </div>
  );
}

/** Skeleton loader for DramaGrid — shimmer effect */
export function DramaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/50 bg-card overflow-hidden"
        >
          <div className="aspect-[2/3] animate-shimmer" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 bg-muted rounded-md animate-shimmer w-3/4" />
            <div className="h-3 bg-muted rounded-md animate-shimmer w-1/2" />
            <div className="flex gap-1.5 pt-0.5">
              <div className="h-5 bg-muted rounded-md animate-shimmer w-12" />
              <div className="h-5 bg-muted rounded-md animate-shimmer w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
