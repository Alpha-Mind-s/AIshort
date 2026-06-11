import { http, HttpResponse } from "msw";
import { mockDramas } from "../data/dramas";

let favorites: { id: number; user_id: number; drama_id: number; created_at: string }[] = [
  { id: 1, user_id: 1, drama_id: 1, created_at: "2026-06-01T00:00:00Z" },
  { id: 2, user_id: 1, drama_id: 3, created_at: "2026-06-05T00:00:00Z" },
  { id: 3, user_id: 1, drama_id: 7, created_at: "2026-06-10T00:00:00Z" },
];

let nextFavoriteId = 4;

export const favoritesHandlers = [
  // POST /favorites
  http.post("*/api/v1/favorites", async ({ request }) => {
    const body = (await request.json()) as { drama_id: number };
    const exists = favorites.find((f) => f.drama_id === body.drama_id);
    if (exists)
      return HttpResponse.json({ code: 409, message: "Already favorited", data: null }, { status: 409 });

    const fav = {
      id: nextFavoriteId++,
      user_id: 1,
      drama_id: body.drama_id,
      created_at: new Date().toISOString(),
    };
    favorites.push(fav);

    return HttpResponse.json(
      { code: 0, message: "success", data: fav },
      { status: 201 }
    );
  }),

  // GET /favorites
  http.get("*/api/v1/favorites", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("page_size")) || 20;

    const total = favorites.length;
    const start = (page - 1) * pageSize;
    const paginated = favorites.slice(start, start + pageSize).map((f) => ({
      ...f,
      drama: mockDramas.find((d) => d.id === f.drama_id) ?? null,
    }));

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: paginated,
      meta: { page, page_size: pageSize, total },
    });
  }),

  // DELETE /favorites/:id
  http.delete("*/api/v1/favorites/:id", ({ params }) => {
    const id = Number(params.id);
    const idx = favorites.findIndex((f) => f.id === id);
    if (idx === -1)
      return HttpResponse.json(
        { code: 404, message: "Favorite not found", data: null },
        { status: 404 }
      );

    favorites.splice(idx, 1);
    return new Response(null, { status: 204 });
  }),
];
