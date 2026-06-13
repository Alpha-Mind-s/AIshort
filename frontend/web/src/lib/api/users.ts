import { apiFetch } from "./client";
import type { AuthUser } from "@/stores/auth-store";

// ---- types ----

export interface UpdateProfileRequest {
  nickname?: string;
  avatar_url?: string;
  language?: string;
  region?: string;
}

// ---- API ----

/** Fetch the current user's profile */
export async function getProfile(): Promise<AuthUser> {
  const res = await apiFetch<AuthUser>("/users/me");
  return res.data;
}

/** Update the current user's profile (partial update) */
export async function updateProfile(data: UpdateProfileRequest): Promise<AuthUser> {
  const res = await apiFetch<AuthUser>("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}
