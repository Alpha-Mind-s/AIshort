import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { configureStudioAuth } from '@/lib/api-client';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  avatar_url?: string | null;
  role: 'user' | 'creator' | 'admin' | 'superadmin';
  language: string;
  region: string;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useStudioAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'studio-auth',
    }
  )
);

configureStudioAuth({
  getToken: () => useStudioAuth.getState().token,
  onLogout: () => useStudioAuth.getState().clearAuth(),
});
