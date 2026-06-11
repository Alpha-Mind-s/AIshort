const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// ---- auth wiring ----

let _getToken: (() => string | null) | null = null;
let _onLogout: (() => void) | null = null;

export function configureStudioAuth(opts: {
  getToken: () => string | null;
  onLogout: () => void;
}) {
  _getToken = opts.getToken;
  _onLogout = opts.onLogout;
}

// ---- typed error ----

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

// ---- generic fetch ----

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ code: number; message: string; data: T; meta?: { page: number; page_size: number; total: number } | null }> {
  const url = `${BASE_URL}${endpoint}`;
  const token = _getToken?.() ?? null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    _onLogout?.();
    throw new ApiError(401, 'Session expired');
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return { code: 0, message: 'ok', data: undefined as T };
  }

  const json = await res.json();

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message || 'Request failed');
  }

  return json;
}

// ---- typed API helpers ----

export interface DramaItem {
  id: number;
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  status: 'draft' | 'published' | 'reviewing' | 'archived';
  total_episodes: number;
  tags: string[];
  created_at: string;
}

export interface EpisodeItem {
  id: number;
  drama_id: number;
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  status: 'processing' | 'ready' | 'failed';
  localizations: { id: number; language: string; subtitle_url: string | null }[];
  created_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  avatar_url: string | null;
  role: 'user' | 'creator' | 'admin' | 'superadmin';
  language: string;
  region: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface PaginatedMeta {
  page: number;
  page_size: number;
  total: number;
}

// ---- auth endpoints ----

export async function loginApi(email: string, password: string) {
  const res = await apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

// ---- drama endpoints ----

export async function getDramaList(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  keyword?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.page_size) sp.set('page_size', String(params.page_size));
  if (params?.status) sp.set('status', params.status);
  if (params?.keyword) sp.set('keyword', params.keyword);
  return apiFetch<DramaItem[]>(`/dramas?${sp.toString()}`);
}

export async function getDramaDetail(id: number) {
  return apiFetch<DramaItem>(`/dramas/${id}`);
}

export async function createDrama(input: {
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  tags: string[];
}) {
  return apiFetch<DramaItem>('/dramas', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateDrama(id: number, input: Record<string, unknown>) {
  return apiFetch<DramaItem>(`/dramas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteDrama(id: number) {
  return apiFetch(`/dramas/${id}`, { method: 'DELETE' });
}

// ---- episode endpoints ----

export async function getDramaEpisodes(dramaId: number) {
  return apiFetch<EpisodeItem[]>(`/dramas/${dramaId}/episodes`);
}

export async function createEpisode(dramaId: number, input: {
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  subtitle_files?: { language: string; url: string }[];
}) {
  return apiFetch<EpisodeItem>(`/dramas/${dramaId}/episodes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function deleteEpisode(id: number) {
  return apiFetch(`/episodes/${id}`, { method: 'DELETE' });
}

// ---- video upload endpoints (aligned with Go backend) ----

export interface UploadUrlRequest {
  filename: string;
  file_size: number;
  content_type: string;
}

/** Backend: POST /videos/upload-url response */
export interface UploadUrlResponse {
  upload_url: string;
  download_url: string;
  expires_at: number; // unix timestamp
}

export interface MultipartInitRequest {
  filename: string;
  file_size: number;
  content_type: string;
}

/** Backend: POST /videos/multipart/init response */
export interface MultipartInitResponse {
  upload_id: string;
  part_size: number;
  parts: number;
}

export interface MultipartCompleteRequest {
  upload_id: string;
  parts: { part_number: number; etag: string }[];
}

export async function getUploadUrl(input: UploadUrlRequest): Promise<UploadUrlResponse> {
  const res = await apiFetch<UploadUrlResponse>('/videos/upload-url', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function initMultipartUpload(input: MultipartInitRequest): Promise<MultipartInitResponse> {
  const res = await apiFetch<MultipartInitResponse>('/videos/multipart/init', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function completeMultipartUpload(input: MultipartCompleteRequest): Promise<void> {
  await apiFetch('/videos/multipart/complete', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Upload a file to a presigned URL via XHR with progress tracking.
 * Used after getUploadUrl() to push the file bytes.
 */
export function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: HTTP ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}
