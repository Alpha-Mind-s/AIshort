import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { Play, Eye, Film } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image-url";
import type { Drama } from "@/lib/api/drama";

interface HeroBannerProps {
  drama: Drama;
}

export function HeroBanner({ drama }: HeroBannerProps) {
  const t = useTranslations("drama");
  const th = useTranslations("home");

  return (
    <section className="relative w-full h-[55vh] min-h-[360px] max-h-[560px] overflow-hidden rounded-2xl">
      {/* Background image */}
      {drama.cover_url ? (
        <Image
          src={getImageUrl(drama.cover_url)}
          alt={drama.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
      )}

      {/* Cinematic gradient overlay — always dark, works in both light/dark mode */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
      {/* Side vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgb(0,0,0,0.85)_95%)]" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <div className="max-w-2xl space-y-4">
          {/* Title — bold, tight tracking, cinematic */}
          <h2 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {drama.title}
          </h2>

          {/* Description */}
          <p className="text-sm md:text-base text-gray-300 line-clamp-2 max-w-lg leading-relaxed">
            {drama.description}
          </p>

          {/* Meta row — dark glass badges (readable in both modes) */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-black/25 backdrop-blur text-white">
              <Eye className="h-3.5 w-3.5" />
              {t("views_count", { count: drama.view_count })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-black/25 backdrop-blur text-white">
              <Film className="h-3.5 w-3.5" />
              {t("episodes_count", { count: drama.total_episodes })}
            </span>
            {drama.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-xs bg-black/25 backdrop-blur text-white"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA — glow button */}
          <div className="pt-2">
            <Link
              href={`/drama/${drama.id}`}
              className="inline-flex items-center gap-2 h-11 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground btn-glow"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              {th("browse_all")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
