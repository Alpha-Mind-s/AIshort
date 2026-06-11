import { http, HttpResponse } from "msw";
import { mockDramas, mockEpisodes, mockVideoAssets } from "../data/dramas";

export const dramaHandlers = [
  // GET /dramas
  http.get("*/api/v1/dramas", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("page_size")) || 20;
    const sort = url.searchParams.get("sort") || "latest";
    const categoryId = url.searchParams.get("category_id");
    const keyword = url.searchParams.get("keyword");
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean);

    let filtered = [...mockDramas];
    if (categoryId) filtered = filtered.filter((d) => d.category_id === Number(categoryId));
    if (keyword) filtered = filtered.filter((d) => d.title.toLowerCase().includes(keyword.toLowerCase()));
    if (tags?.length) filtered = filtered.filter((d) => d.tags.some((t) => tags.includes(t)));

    // Sort
    if (sort === "trending") filtered.sort((a, b) => b.view_count - a.view_count);
    else if (sort === "popular") filtered.sort((a, b) => b.like_count - a.like_count);
    else filtered.sort((a, b) => new Date(b.release_at).getTime() - new Date(a.release_at).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: paginated,
      meta: { page, page_size: pageSize, total },
    });
  }),

  // GET /dramas/:id
  http.get("*/api/v1/dramas/:id", ({ params }) => {
    const drama = mockDramas.find((d) => d.id === Number(params.id));
    if (!drama)
      return HttpResponse.json({ code: 404, message: "Drama not found", data: null }, { status: 404 });
    return HttpResponse.json({ code: 0, message: "success", data: drama });
  }),

  // GET /dramas/:id/episodes
  http.get("*/api/v1/dramas/:id/episodes", ({ params }) => {
    const episodes = mockEpisodes.filter((e) => e.drama_id === Number(params.id));
    return HttpResponse.json({ code: 0, message: "success", data: episodes });
  }),

  // GET /episodes/:id
  http.get("*/api/v1/episodes/:id", ({ params }) => {
    const ep = mockEpisodes.find((e) => e.id === Number(params.id));
    if (!ep)
      return HttpResponse.json({ code: 404, message: "Episode not found", data: null }, { status: 404 });
    return HttpResponse.json({ code: 0, message: "success", data: ep });
  }),

  // GET /episodes/:id/play
  http.get("*/api/v1/episodes/:id/play", ({ params, request }) => {
    const ep = mockEpisodes.find((e) => e.id === Number(params.id));
    if (!ep)
      return HttpResponse.json({ code: 404, message: "Episode not found", data: null }, { status: 404 });

    const url = new URL(request.url);
    const quality = url.searchParams.get("quality") || "720p";
    const assets = mockVideoAssets[ep.id];
    const asset = assets?.[quality as keyof typeof assets] ?? assets?.["720p"];

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        episode: ep,
        play_url: asset?.url ?? ep.video_url,
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        qualities: Object.entries(assets ?? {}).map(([resolution, info]) => ({
          resolution,
          url: info.url,
          bitrate: info.bitrate,
        })),
      },
    });
  }),
];
