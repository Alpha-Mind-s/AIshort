import { apiFetch } from "./client";
import type { PaginatedMeta } from "./drama";
import type { AuthUser } from "@/stores/auth-store";

export interface Comment {
  id: number;
  user: Pick<
    AuthUser,
    "id" | "email" | "nickname" | "avatar_url" | "role" | "language" | "region" | "created_at"
  >;
  drama_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface CreateCommentRequest {
  content: string;
  parent_id?: number;
}

export async function createComment(
  dramaId: number,
  data: CreateCommentRequest
): Promise<Comment> {
  const res = await apiFetch<Comment>(`/dramas/${dramaId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getComments(
  dramaId: number,
  sort: "latest" | "hottest" = "latest",
  page = 1,
  page_size = 20
): Promise<{ data: Comment[]; meta: PaginatedMeta }> {
  const res = await apiFetch<Comment[]>(
    `/dramas/${dramaId}/comments?sort=${sort}&page=${page}&page_size=${page_size}`
  );
  return { data: res.data, meta: res.meta! };
}

export async function deleteComment(id: number): Promise<void> {
  await apiFetch(`/comments/${id}`, { method: "DELETE" });
}

export async function likeComment(
  id: number
): Promise<{ is_liked: boolean; likes_count: number }> {
  const res = await apiFetch<{ is_liked: boolean; likes_count: number }>(
    `/comments/${id}/like`,
    { method: "POST" }
  );
  return res.data;
}
