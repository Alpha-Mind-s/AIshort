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
      <div className="text-center py-12 text-muted-foreground">
        {t("no_dramas")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {dramas.map((drama) => (
        <DramaCard key={drama.id} drama={drama} />
      ))}
    </div>
  );
}

/** Skeleton loader for DramaGrid */
export function DramaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
          <div className="aspect-[2/3] bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
