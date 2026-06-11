import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { serverGetDramaDetail, serverGetDramaEpisodes } from "@/lib/mocks/data-access";
import { EpisodeList } from "@/components/drama/EpisodeList";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { CommentSection } from "@/components/comment/CommentSection";
import { formatDate, formatCount } from "@/lib/utils/format";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export default async function DramaDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("drama");

  // BFF: fetch drama detail + episodes in parallel
  const [drama, episodes] = await Promise.all([
    serverGetDramaDetail(Number(id)),
    serverGetDramaEpisodes(Number(id)),
  ]);

  if (!drama) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Hero section with cover */}
      <div className="relative h-48 md:h-64 bg-muted">
        {drama.cover_url && (
          <Image
            src={drama.cover_url}
            alt={drama.title}
            fill
            sizes="100vw"
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        {/* Title and info */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Cover poster */}
          <div className="flex-shrink-0 relative w-36 h-48 md:w-44 md:h-60 rounded-lg overflow-hidden shadow-xl border-2 border-background">
            <Image
              src={drama.cover_url}
              alt={drama.title}
              fill
              sizes="(max-width: 768px) 144px, 176px"
              className="object-cover"
              priority
            />
          </div>

          {/* Meta */}
          <div className="flex-1 pt-4 space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold">{drama.title}</h1>

            {drama.description && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-3">
                {drama.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>{formatCount(drama.view_count)} views</span>
              <span>{drama.total_episodes} episodes</span>
              {drama.release_at && <span>{formatDate(drama.release_at)}</span>}
            </div>

            {drama.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {drama.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Creator + Favorite */}
            <div className="flex items-center justify-between pt-2">
              {drama.creator && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {drama.creator.nickname.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{drama.creator.nickname}</span>
                  <span className="text-xs text-muted-foreground">· Creator</span>
                </div>
              )}
              <FavoriteButton dramaId={drama.id} />
            </div>
          </div>
        </div>

        {/* Episodes section */}
        <section className="mt-10 pb-12">
          <h2 className="text-xl font-bold mb-4">
            {t("episodes")} ({episodes.length})
          </h2>
          <EpisodeList episodes={episodes} dramaId={drama.id} />
        </section>
        {/* Comments section */}
        <section className="mt-10 pb-12 border-t border-border pt-8">
          <CommentSection dramaId={drama.id} />
        </section>
      </div>
    </div>
  );
}
