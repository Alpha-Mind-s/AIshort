export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

export const APP_NAME = "AIshort";

export const LOCALES = ["en", "es", "pt", "ja", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export const VIDEO_QUALITIES = ["1080p", "720p", "480p"] as const;
export type VideoQuality = (typeof VIDEO_QUALITIES)[number];

export const SUBSCRIPTION_PLANS = ["monthly", "quarterly", "yearly"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const USER_ROLES = ["user", "creator", "admin", "superadmin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DRAMA_STATUS = ["draft", "published", "reviewing", "archived"] as const;
export const DRAMA_SORT = ["latest", "popular", "trending"] as const;

export const OAUTH_PROVIDERS = ["google", "apple", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
