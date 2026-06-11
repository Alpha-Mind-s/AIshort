import { apiFetch } from "./client";
import type { Drama, PaginatedMeta } from "./drama";

export interface Favorite {
  id: number;
  user_id: number;
  drama_id: number;
  drama?: Drama;
  created_at: string;
}

export async function addFavorite(
  drama_id: number
): Promise<Favorite> {
  const res = await apiFetch<Favorite>("/favorites", {
    method: "POST",
    body: JSON.stringify({ drama_id }),
  });
  return res.data;
}

export async function removeFavorite(id: number): Promise<void> {
  await apiFetch(`/favorites/${id}`, { method: "DELETE" });
}

export async function getFavorites(
  page = 1,
  page_size = 20
): Promise<{ data: Favorite[]; meta: PaginatedMeta }> {
  const res = await apiFetch<Favorite[]>(
    `/favorites?page=${page}&page_size=${page_size}`
  );
  return { data: res.data, meta: res.meta! };
}
