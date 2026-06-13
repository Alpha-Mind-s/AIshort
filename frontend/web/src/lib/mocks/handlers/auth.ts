import { http, HttpResponse } from "msw";
import { mockUsers } from "../data/users";

export const authHandlers = [
  // POST /auth/register
  http.post("*/api/v1/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      nickname: string;
    };
    if (mockUsers.find((u) => u.email === body.email)) {
      return HttpResponse.json(
        { code: 409, message: "Email already exists", data: null },
        { status: 409 }
      );
    }
    const user = {
      ...mockUsers[0],
      email: body.email,
      nickname: body.nickname,
    };
    return HttpResponse.json(
      {
        code: 0,
        message: "success",
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 900,
          user,
        },
      },
      { status: 201 }
    );
  }),

  // POST /auth/login
  http.post("*/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = mockUsers.find((u) => u.email === body.email);
    if (!user || body.password !== "password123") {
      return HttpResponse.json(
        { code: 401, message: "Invalid email or password", data: null },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_in: 900,
        user,
      },
    });
  }),

  // GET /auth/oauth/:provider
  http.get("*/api/v1/auth/oauth/:provider", ({ params }) => {
    const { provider } = params;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `https://accounts.${provider}.com/o/oauth2/auth?mock=true`,
      },
    });
  }),

  // POST /auth/oauth/:provider/callback
  http.post(
    "*/api/v1/auth/oauth/:provider/callback",
    async ({ params }) => {
      const oauthUser = mockUsers.find(
        (u) => u.oauth_provider === params.provider
      );
      if (!oauthUser) {
        return HttpResponse.json(
          { code: 401, message: "OAuth authentication failed", data: null },
          { status: 401 }
        );
      }
      return HttpResponse.json({
        code: 0,
        message: "success",
        data: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 900,
          user: oauthUser,
        },
      });
    }
  ),

  // POST /auth/refresh
  http.post("*/api/v1/auth/refresh", async ({ request }) => {
    const body = (await request.json()) as { refresh_token: string };
    if (!body.refresh_token) {
      return HttpResponse.json(
        { code: 401, message: "Invalid refresh token", data: null },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: {
        access_token: "mock-access-token-refreshed",
        refresh_token: "mock-refresh-token-new",
        expires_in: 900,
        user: mockUsers[0],
      },
    });
  }),

  // POST /auth/logout
  http.post("*/api/v1/auth/logout", () => {
    return HttpResponse.json({ code: 0, message: "success", data: null });
  }),

  // GET /users/me
  http.get("*/api/v1/users/me", ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(
        { code: 401, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: mockUsers[0],
    });
  }),

  // PUT /users/me
  http.put("*/api/v1/users/me", async ({ request }) => {
    const body = (await request.json()) as {
      nickname?: string;
      avatar_url?: string;
      language?: string;
      region?: string;
    };
    // Mutate mockUsers[0] in place so subsequent GET /users/me returns the update
    Object.assign(mockUsers[0],
      Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined && v !== "")
      ),
      { updated_at: new Date().toISOString() }
    );
    return HttpResponse.json({
      code: 0,
      message: "success",
      data: mockUsers[0],
    });
  }),
];
