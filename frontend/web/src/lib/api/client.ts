/**
 * API Client — thin wrapper around native fetch with JWT injection and auto-refresh.
 *
 * In mock mode (NEXT_PUBLIC_MOCK=true), MSW intercepts requests at the network level,
 * so code runs through the same code path. Just disable MSW to switch to real APIs.
 */

import { API_BASE_URL } from "@/lib/utils/constants";

// ---- types ----

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  meta?: {
    page: number;
    page_size: number;
    total: number;
  } | null;
}

export class ApiError extends Error {
  code: number;
  details?: unknown;

  constructor(code: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

// ---- internal helpers ----

let _getAccessToken: (() => string | null) | null = null;
let _onRefreshFailed: (() => void) | null = null;

/** Register auth callbacks — called once from the auth store */
export function configureAuth(options: {
  getAccessToken: () => string | null;
  onRefreshFailed: () => void;
}) {
  _getAccessToken = options.getAccessToken;
  _onRefreshFailed = options.onRefreshFailed;
}

// ---- client ----

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: localStorage.getItem("refresh_token"),
      }),
    });
    if (!res.ok) return null;
    const json: ApiResponse<{ access_token: string; expires_in: number }> =
      await res.json();
    if (json.code !== 0) return null;
    return json.data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = _getAccessToken?.() ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401 (only try once)
  if (res.status === 401 && token && !headers["X-Retry"]) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      headers["X-Retry"] = "1";
      res = await fetch(url, { ...options, headers });
    } else {
      _onRefreshFailed?.();
      throw new ApiError(401, "Session expired. Please log in again.");
    }
  }

  const json = await res.json();

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message, json.details);
  }

  return json;
}
