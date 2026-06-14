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
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {drama.cover_url ? (
          <Image
            src={getImageUrl(drama.cover_url)}
            alt={drama.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
        {/* Episode count badge */}
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          {t("ep_abbr", { count: drama.total_episodes })}
        </span>
        {/* Status badge */}
        {drama.status !== "published" && (
          <span className="absolute top-2 left-2 rounded bg-yellow-500 px-2 py-0.5 text-xs font-medium text-white">
            {drama.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {drama.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{drama.category_id}</span>
          <span>{t("views_count", { count: drama.view_count })}</span>
        </div>
        {drama.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {drama.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
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
