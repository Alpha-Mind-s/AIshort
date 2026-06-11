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

// ---- write endpoints ----

export interface CreateDramaInput {
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  tags: string[];
}

export interface UpdateDramaInput {
  title?: string;
  description?: string;
  cover_url?: string;
  category_id?: number;
  tags?: string[];
  status?: Drama["status"];
}

export interface CreateEpisodeInput {
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  subtitle_files?: { language: string; url: string }[];
}

export interface UpdateEpisodeInput {
  episode_no?: number;
  title?: string;
  duration?: number;
  video_url?: string;
  status?: Episode["status"];
}

export async function createDrama(input: CreateDramaInput): Promise<Drama> {
  const res = await apiFetch<Drama>("/dramas", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateDrama(id: number, input: UpdateDramaInput): Promise<Drama> {
  const res = await apiFetch<Drama>(`/dramas/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteDrama(id: number): Promise<void> {
  await apiFetch(`/dramas/${id}`, { method: "DELETE" });
}

export async function updateDramaStatus(
  id: number,
  status: Drama["status"]
): Promise<Drama> {
  const res = await apiFetch<Drama>(`/dramas/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function createEpisode(
  dramaId: number,
  input: CreateEpisodeInput
): Promise<Episode> {
  const res = await apiFetch<Episode>(`/dramas/${dramaId}/episodes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateEpisode(
  id: number,
  input: UpdateEpisodeInput
): Promise<Episode> {
  const res = await apiFetch<Episode>(`/episodes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteEpisode(id: number): Promise<void> {
  await apiFetch(`/episodes/${id}`, { method: "DELETE" });
}

// ---- video upload ----

export interface UploadUrlRequest {
  filename: string;
  file_size: number;
  content_type: string;
}

export interface UploadUrlResponse {
  upload_id: string;
  upload_url: string;
  download_url: string;
  expires_in: number;
}

export interface UploadCompleteRequest {
  upload_id: string;
  parts?: { part_number: number; etag: string }[];
}

export interface UploadCompleteResponse {
  video_url: string;
  duration: number;
  status: string;
}

export async function getUploadUrl(
  input: UploadUrlRequest
): Promise<UploadUrlResponse> {
  const res = await apiFetch<UploadUrlResponse>("/videos/upload-url", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function completeUpload(
  input: UploadCompleteRequest
): Promise<UploadCompleteResponse> {
  const res = await apiFetch<UploadCompleteResponse>("/videos/upload/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.data;
}
