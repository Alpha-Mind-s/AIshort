import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/utils/image-url";
import type { Drama } from "@/lib/api/drama";

interface HeroBannerProps {
  drama: Drama;
}

export function HeroBanner({ drama }: HeroBannerProps) {
  const t = useTranslations("drama");
  const th = useTranslations("home");

  return (
    <section className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden rounded-xl">
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
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            {drama.title}
          </h2>
          <p className="text-sm md:text-base text-gray-300 line-clamp-2">
            {drama.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{t("views_count", { count: drama.view_count })}</span>
            <span>{t("episodes_count", { count: drama.total_episodes })}</span>
            {drama.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/drama/${drama.id}`}
              className="inline-flex items-center gap-2 h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
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
