/**
 * Rewrite image URLs so they work both in the browser and inside Docker.
 *
 * Problem: cover/video URLs in the DB use `http://localhost:8080/files/...`.
 * - Browser:  localhost:8080 → Docker port forward → gateway  ✅
 * - Next.js server (inside Docker): localhost:8080 → container itself  ❌
 *
 * Solution: rewrite localhost:8080 → api-gateway:8080 for server-side fetches.
 * This is a dev-only concern; production uses a real CDN hostname.
 */

const DEV_REWRITE_FROM = "http://localhost:8080/";
const DEV_REWRITE_TO = "http://api-gateway:8080/";

/**
 * Returns an image URL suitable for Next.js Image optimization.
 *
 * Always rewrites localhost → api-gateway because the Next.js image optimizer
 * (/_next/image) fetches the source image server-side inside Docker, where
 * localhost:8080 points to the container itself, not the gateway.
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(DEV_REWRITE_FROM, DEV_REWRITE_TO);
}
