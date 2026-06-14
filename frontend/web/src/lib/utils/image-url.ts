/**
 * Rewrite image URLs so they work both in the browser and inside Docker.
 *
 * Problem: cover/video URLs in the DB may use either hostname depending on
 * the upload context. We need the URL that actually resolves:
 * - Host-based dev: api-gateway:8080 → localhost:8080 (Docker port forward)
 * - Docker-based dev: localhost:8080 → api-gateway:8080 (Docker DNS)
 *
 * This is a dev-only concern; production uses a real CDN hostname.
 */

const DOCKER_HOST = "http://api-gateway:8080/";
const LOCALHOST = "http://localhost:8080/";

/**
 * Returns an image URL suitable for Next.js Image optimization.
 *
 * Normalizes Docker hostname → localhost so it works in host-based dev
 * (browser fetches through Docker port-forward, server fetches directly).
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(DOCKER_HOST, LOCALHOST);
}
