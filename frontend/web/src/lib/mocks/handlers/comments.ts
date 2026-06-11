import { http, HttpResponse } from "msw";
import { mockUsers } from "../data/users";

interface MockComment {
  id: number;
  user_id: number;
  drama_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  status: string;
  created_at: string;
}

const comments: MockComment[] = [
  { id: 1, user_id: 1, drama_id: 1, parent_id: null, content: "This drama is amazing! Can't wait for the next episode.", likes_count: 42, status: "active", created_at: "2026-06-01T12:00:00Z" },
  { id: 2, user_id: 2, drama_id: 1, parent_id: 1, content: "Totally agree! The acting is superb.", likes_count: 15, status: "active", created_at: "2026-06-01T13:00:00Z" },
  { id: 3, user_id: 3, drama_id: 1, parent_id: null, content: "Been following this since day one. Best short drama platform!", likes_count: 28, status: "active", created_at: "2026-06-02T09:00:00Z" },
  { id: 4, user_id: 1, drama_id: 3, parent_id: null, content: "The plot twist in episode 3 was insane 🔥", likes_count: 56, status: "active", created_at: "2026-06-05T18:00:00Z" },
  { id: 5, user_id: 4, drama_id: 3, parent_id: 4, content: "I know right?! Did not see that coming.", likes_count: 12, status: "active", created_at: "2026-06-05T19:00:00Z" },
  { id: 6, user_id: 2, drama_id: 2, parent_id: null, content: "Great action sequences. The choreography is top notch.", likes_count: 33, status: "active", created_at: "2026-06-03T10:00:00Z" },
];

let nextCommentId = 7;
const likedComments = new Set<number>();

function enrichComment(c: MockComment) {
  const user = mockUsers.find((u) => u.id === c.user_id);
  return {
    ...c,
    user: user
      ? { id: user.id, email: user.email, nickname: user.nickname, avatar_url: user.avatar_url, role: user.role, language: user.language, region: user.region, created_at: user.created_at }
      : null,
    is_liked: likedComments.has(c.id),
  };
}

export const commentsHandlers = [
  // POST /dramas/:id/comments
  http.post("*/api/v1/dramas/:id/comments", async ({ params, request }) => {
    const body = (await request.json()) as { content: string; parent_id?: number };
    const comment: MockComment = {
      id: nextCommentId++,
      user_id: 1,
      drama_id: Number(params.id),
      parent_id: body.parent_id ?? null,
      content: body.content,
      likes_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };
    comments.unshift(comment);

    return HttpResponse.json(
      { code: 0, message: "success", data: enrichComment(comment) },
      { status: 201 }
    );
  }),

  // GET /dramas/:id/comments
  http.get("*/api/v1/dramas/:id/comments", ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const pageSize = Number(url.searchParams.get("page_size")) || 20;
    const sort = url.searchParams.get("sort") || "latest";

    let filtered = comments.filter((c) => c.drama_id === Number(params.id));

    if (sort === "hottest") filtered.sort((a, b) => b.likes_count - a.likes_count);
    else filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: paginated.map(enrichComment),
      meta: { page, page_size: pageSize, total },
    });
  }),

  // DELETE /comments/:id
  http.delete("*/api/v1/comments/:id", () => {
    return new Response(null, { status: 204 });
  }),

  // POST /comments/:id/like
  http.post("*/api/v1/comments/:id/like", ({ params }) => {
    const id = Number(params.id);
    if (likedComments.has(id)) {
      likedComments.delete(id);
    } else {
      likedComments.add(id);
    }
    const comment = comments.find((c) => c.id === id);
    const likesCount = (comment?.likes_count ?? 0) + (likedComments.has(id) ? 1 : -1);

    return HttpResponse.json({
      code: 0,
      message: "success",
      data: { is_liked: likedComments.has(id), likes_count: likesCount },
    });
  }),
];
