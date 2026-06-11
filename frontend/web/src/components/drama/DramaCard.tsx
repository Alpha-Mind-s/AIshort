import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { formatCount } from "@/lib/utils/format";
import { Play } from "lucide-react";
import type { Drama } from "@/lib/api/drama";

interface DramaCardProps {
  drama: Drama;
}

export function DramaCard({ drama }: DramaCardProps) {
  return (
    <Link
      href={`/drama/${drama.id}`}
      className="group block rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        <Image
          src={drama.cover_url}
          alt={drama.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
        </div>
        {/* Episode count badge */}
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          {drama.total_episodes} ep
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
          <span>{formatCount(drama.view_count)} views</span>
        </div>
        {drama.tags.length > 0 && (
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
