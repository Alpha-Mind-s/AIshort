import { apiFetch, type ApiResponse } from "./client";

// ---- types (mirrors generated OpenAPI types) ----

export interface Drama {
  id: number;
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  creator: {
    id: number;
    email: string;
    nickname: string;
    avatar_url: string | null;
    role: string;
    language: string;
    region: string;
    created_at: string;
  };
  total_episodes: number;
  status: "draft" | "published" | "reviewing" | "archived";
  tags: string[];
  release_at: string;
  created_at: string;
  view_count: number;
  like_count: number;
  favorite_count: number;
}

export interface Episode {
  id: number;
  drama_id: number;
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  status: "processing" | "ready" | "failed";
  localizations: Localization[];
  created_at: string;
}

export interface Localization {
  id: number;
  episode_id: number;
  language: string;
  title_translated: string;
  dub_url: string | null;
  subtitle_url: string | null;
  lip_sync_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface VideoQuality {
  resolution: string;
  url: string;
  bitrate: number;
}

export interface EpisodePlayInfo {
  episode: Episode;
  play_url: string;
  expires_at: string;
  qualities: VideoQuality[];
}

export interface DramaListParams {
  category_id?: number;
  sort?: "latest" | "popular" | "trending";
  keyword?: string;
  tags?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedMeta {
  page: number;
  page_size: number;
  total: number;
}

// ---- endpoints ----

export async function getDramaList(
  params?: DramaListParams
): Promise<{ data: Drama[]; meta: PaginatedMeta }> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        searchParams.set(k, String(v));
      }
    });
  }
  const res = await apiFetch<Drama[]>(
    `/dramas?${searchParams.toString()}`
  );
  return { data: res.data, meta: res.meta! };
}

export async function getDramaDetail(id: number): Promise<Drama> {
  const res = await apiFetch<Drama>(`/dramas/${id}`);
  return res.data;
}

export async function getDramaEpisodes(id: number): Promise<Episode[]> {
  const res = await apiFetch<Episode[]>(`/dramas/${id}/episodes`);
  return res.data;
}

export async function getEpisode(id: number): Promise<Episode> {
  const res = await apiFetch<Episode>(`/episodes/${id}`);
  return res.data;
}

export async function getEpisodePlay(
  id: number,
  quality?: string,
  language?: string
): Promise<EpisodePlayInfo> {
  const searchParams = new URLSearchParams();
  if (quality) searchParams.set("quality", quality);
  if (language) searchParams.set("language", language);

  const res = await apiFetch<EpisodePlayInfo>(
    `/episodes/${id}/play?${searchParams.toString()}`
  );
  return res.data;
}
