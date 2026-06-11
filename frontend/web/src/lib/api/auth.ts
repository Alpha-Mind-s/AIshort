import { apiFetch, type ApiResponse } from "./client";
import type { AuthUser } from "@/stores/auth-store";

// ---- types ----

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface OAuthCallbackRequest {
  code: string;
}

export type OAuthProvider = "google" | "apple" | "facebook";

// ---- endpoints ----

export async function register(
  data: RegisterRequest
): Promise<AuthTokens> {
  const res = await apiFetch<AuthTokens>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const res = await apiFetch<AuthTokens>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function oauthCallback(
  provider: OAuthProvider,
  code: string
): Promise<AuthTokens> {
  const res = await apiFetch<AuthTokens>(
    `/auth/oauth/${provider}/callback`,
    {
      method: "POST",
      body: JSON.stringify({ code }),
    }
  );
  return res.data;
}

export async function refreshToken(
  refresh_token: string
): Promise<AuthTokens> {
  const res = await apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token }),
  });
  return res.data;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
