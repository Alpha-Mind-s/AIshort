import { NextRequest } from "next/server";

/**
 * Video proxy — streams video files from the internal gateway so the browser
 * sees same-origin URLs (no CORS preflight / no-cors-mode issues).
 *
 * Usage: /api/video-proxy?url=http://localhost:8080/files/...
 *
 * The Next.js server runs inside Docker, so we rewrite localhost:8080
 * → api-gateway:8080 (the gateway's internal Docker hostname).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("missing url", { status: 400 });
  }

  // Rewrite so Docker-internal DNS resolves correctly
  const upstream = url.replace("http://localhost:8080/", "http://api-gateway:8080/");

  const headers = new Headers();
  // Forward the Range header so the browser can seek
  const range = request.headers.get("range");
  if (range) {
    headers.set("Range", range);
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, { headers });
  } catch {
    return new Response("upstream unreachable", { status: 502 });
  }

  if (!upstreamRes.ok && upstreamRes.status !== 206) {
    return new Response("upstream error", { status: upstreamRes.status });
  }

  // Pass through the content-related headers
  const resHeaders = new Headers();
  const copy = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "etag",
  ];
  for (const h of copy) {
    const v = upstreamRes.headers.get(h);
    if (v) resHeaders.set(h, v);
  }

  // Also copy any CORS-free headers — not needed here, but safe

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}
