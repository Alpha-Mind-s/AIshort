/**
 * Data access layer that works in both Server and Client Components.
 *
 * - On the **server** (SSR/RSC): returns mock data directly (no network call).
 * - On the **client**: delegates to the API client (which MSW intercepts in-browser).
 *
 * When the real backend is ready, just set NEXT_PUBLIC_MOCK=false and all
 * calls go through the real API.
 */

import type { Drama, Episode, EpisodePlayInfo, PaginatedMeta, DramaListParams } from "@/lib/api/drama";
import type { Favorite } from "@/lib/api/favorites";
import type { Comment } from "@/lib/api/comments";
import type {
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionRequest,
} from "@/lib/api/subscriptions";
import type { AuthTokens, LoginRequest, RegisterRequest, OAuthProvider } from "@/lib/api/auth";
import { mockDramas, mockEpisodes, mockVideoAssets } from "./data/dramas";
import { mockUsers } from "./data/users";
import { mockSubscriptionPlans, mockSubscriptions } from "./data/subscriptions";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === "true";
const IS_SERVER = typeof window === "undefined";

// ---- Auth ----

export async function mockLogin(data: LoginRequest): Promise<AuthTokens> {
  const user = mockUsers.find((u) => u.email === data.email);
  if (!user || data.password !== "password123") {
    throw Object.assign(new Error("Invalid email or password"), { code: 401 });
  }
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 900,
    user,
  };
}

export async function mockRegister(data: RegisterRequest): Promise<AuthTokens> {
  if (mockUsers.find((u) => u.email === data.email)) {
    throw Object.assign(new Error("Email already exists"), { code: 409 });
  }
  const user = { ...mockUsers[0], email: data.email, nickname: data.nickname };
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 900,
    user,
  };
}

// ---- Dramas ----

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, page_size: pageSize, total } as PaginatedMeta,
  };
}

export async function serverGetDramaList(params?: DramaListParams) {
  let filtered = [...mockDramas];
  if (params?.category_id) filtered = filtered.filter((d) => d.category_id === params.category_id);
  if (params?.keyword) filtered = filtered.filter((d) => d.title.toLowerCase().includes(params.keyword!.toLowerCase()));
  if (params?.tags) {
    const tags = params.tags.split(",").filter(Boolean);
    if (tags.length) filtered = filtered.filter((d) => d.tags.some((t) => tags.includes(t)));
  }

  const sort = params?.sort ?? "latest";
  if (sort === "trending") filtered.sort((a, b) => b.view_count - a.view_count);
  else if (sort === "popular") filtered.sort((a, b) => b.like_count - a.like_count);
  else filtered.sort((a, b) => new Date(b.release_at).getTime() - new Date(a.release_at).getTime());

  return paginate(filtered, params?.page ?? 1, params?.page_size ?? 20);
}

export async function serverGetDramaDetail(id: number): Promise<Drama | null> {
  return mockDramas.find((d) => d.id === id) ?? null;
}

export async function serverGetDramaEpisodes(id: number): Promise<Episode[]> {
  return mockEpisodes.filter((e) => e.drama_id === id);
}

export async function serverGetEpisodePlay(id: number, quality = "720p"): Promise<EpisodePlayInfo | null> {
  const ep = mockEpisodes.find((e) => e.id === id);
  if (!ep) return null;
  const assets = mockVideoAssets[ep.id];
  const asset = assets?.[quality as keyof typeof assets] ?? assets?.["720p"];
  return {
    episode: ep,
    play_url: asset?.url ?? ep.video_url,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    qualities: Object.entries(assets ?? {}).map(([resolution, info]) => ({
      resolution,
      url: info.url,
      bitrate: info.bitrate,
    })),
  };
}

// ---- Favorites ----

let mockFavorites: Favorite[] = [];

export async function serverGetFavorites(page = 1, pageSize = 20) {
  const withDrama = mockFavorites.map((f) => ({
    ...f,
    drama: mockDramas.find((d) => d.id === f.drama_id),
  }));
  return paginate(withDrama, page, pageSize);
}

export async function serverAddFavorite(dramaId: number): Promise<Favorite> {
  if (mockFavorites.find((f) => f.drama_id === dramaId)) {
    throw Object.assign(new Error("Already favorited"), { code: 409 });
  }
  const fav = { id: Date.now(), user_id: 1, drama_id: dramaId, created_at: new Date().toISOString() };
  mockFavorites.push(fav);
  return fav;
}

// ---- Comments ----

let mockComments: Comment[] = [
  { id: 1, user: { id: 1, email: "test@example.com", nickname: "TestUser", avatar_url: null, role: "user", language: "en", region: "US", created_at: "" }, drama_id: 1, parent_id: null, content: "Amazing drama! Can't wait for more.", likes_count: 42, is_liked: false, created_at: "2026-06-01T12:00:00Z" },
  { id: 2, user: { id: 3, email: "creator@example.com", nickname: "Creator", avatar_url: null, role: "creator", language: "zh", region: "CN", created_at: "" }, drama_id: 1, parent_id: 1, content: "Thank you! New episodes coming soon.", likes_count: 15, is_liked: false, created_at: "2026-06-01T13:00:00Z" },
];

export async function serverGetComments(dramaId: number, sort = "latest", page = 1, pageSize = 20) {
  let filtered = mockComments.filter((c) => c.drama_id === dramaId);
  if (sort === "hottest") filtered.sort((a, b) => b.likes_count - a.likes_count);
  else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return paginate(filtered, page, pageSize);
}

// ---- Subscriptions ----

export async function serverGetPlans(): Promise<SubscriptionPlan[]> {
  return mockSubscriptionPlans;
}

export async function serverGetSubscriptionStatus(): Promise<Subscription | null> {
  return mockSubscriptions[0] ?? null;
}

export async function serverCreateSubscription(
  data: CreateSubscriptionRequest
): Promise<{ subscription_id: number; payment_url: string }> {
  const url = data.channel === "paypal"
    ? "https://www.paypal.com/checkout/mock"
    : "https://checkout.stripe.com/pay/mock";
  return { subscription_id: 2, payment_url: url };
}
