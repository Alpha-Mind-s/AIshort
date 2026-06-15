"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { getImageUrl } from "@/lib/utils/image-url";
import { Play } from "lucide-react";
import type { Drama } from "@/lib/api/drama";

interface DramaCardProps {
  drama: Drama;
}

export function DramaCard({ drama }: DramaCardProps) {
  const t = useTranslations("drama");
  return (
    <Link
      href={`/drama/${drama.id}`}
      className="group block rounded-xl overflow-hidden border border-border/50 bg-card hover:shadow-lg transition-all duration-300 ease-out hover:-translate-y-1"
    >
      {/* Cover — poster aspect ratio */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {drama.cover_url ? (
          <Image
            src={getImageUrl(drama.cover_url)}
            alt={drama.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 p-4">
            <span className="text-muted-foreground/30 text-6xl font-extrabold tracking-tighter select-none">
              AI
            </span>
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
          <Play
            className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
            fill="white"
          />
        </div>

        {/* Episode count badge — glass */}
        <span className="absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-sm shadow-md shadow-black/30">
          {t("ep_abbr", { count: drama.total_episodes })}
        </span>

        {/* Status badge */}
        {drama.status !== "published" && (
          <span className="absolute top-2 left-2 rounded-full bg-yellow-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
            {drama.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {drama.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{t("views_count", { count: drama.view_count })}</span>
        </div>
        {/* Tags — subtle, glass-style on dark */}
        {drama.tags?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-0.5">
            {drama.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
