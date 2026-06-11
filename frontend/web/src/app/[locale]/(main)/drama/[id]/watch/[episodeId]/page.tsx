import { getTranslations } from "next-intl/server";
import type { Drama, Episode } from "@/lib/api/drama";
import { WatchPageClient } from "./client";
import { notFound } from "next/navigation";

const API_BASE = process.env.API_GATEWAY
  ? `http://${process.env.API_GATEWAY}/api/v1`
  : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

async function fetchDrama(id: number): Promise<Drama | null> {
  const res = await fetch(`${API_BASE}/dramas/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.code === 0 ? json.data : null;
}

async function fetchEpisodes(id: number): Promise<Episode[]> {
  const res = await fetch(`${API_BASE}/dramas/${id}/episodes`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.code === 0 ? (json.data ?? []) : [];
}

interface Props {
  params: Promise<{ id: string; episodeId: string; locale: string }>;
}

export default async function WatchPage({ params }: Props) {
  const { id, episodeId, locale } = await params;
  const t = await getTranslations("player");
  const dramaId = Number(id);
  const epId = Number(episodeId);

  const [episodes, drama] = await Promise.all([
    fetchEpisodes(dramaId),
    fetchDrama(dramaId),
  ]);

  if (!drama) {
    notFound();
  }

  // Find current episode info for display
  const currentEpisode = episodes.find((ep) => ep.id === epId);

  return (
    <WatchPageClient
      episodeId={epId}
      dramaId={dramaId}
      dramaTitle={drama.title}
      episodeNo={currentEpisode?.episode_no}
      episodeTitle={currentEpisode?.title}
      episodeDuration={currentEpisode?.duration}
      episodes={episodes}
      locale={locale}
    />
  );
}
