import { create } from "zustand";
import { persist } from "zustand/middleware";
import { configureAuth } from "@/lib/api/client";

// ---- types ----

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  avatar_url?: string | null;
  role: "user" | "creator" | "admin" | "superadmin";
  language: string;
  region: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

// ---- store ----

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // Store refresh token in localStorage (not Zustand persist, for security)
        localStorage.setItem("refresh_token", refreshToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...partial } });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Wire up the API client with auth callbacks
configureAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,

  // When the API client auto-refreshes the token pair, update the store
  // so subsequent API calls and page interactions use the fresh token.
  onRefreshSuccess: (accessToken, refreshToken) => {
    const state = useAuthStore.getState();
    if (state.user) {
      localStorage.setItem("refresh_token", refreshToken);
      useAuthStore.setState({ accessToken, isAuthenticated: true });
    }
  },

  onRefreshFailed: () => useAuthStore.getState().clearAuth(),
});
