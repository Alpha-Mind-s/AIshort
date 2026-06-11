"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/lib/i18n/navigation";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/stores/auth-store";
import * as authApi from "@/lib/api/auth";
import type { OAuthProvider, AuthTokens, LoginRequest, RegisterRequest } from "@/lib/api/auth";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK === "true" || true; // force mock for now

function mockAuthTokens(email: string, nickname?: string): AuthTokens {
  const user: AuthUser = {
    id: Date.now(),
    email,
    nickname: nickname || email.split("@")[0],
    avatar_url: null,
    role: email.includes("admin") ? "admin" as const : "user" as const,
    language: "en",
    region: "US",
    created_at: new Date().toISOString(),
  };
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 900,
    user,
  };
}

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: IS_MOCK
      ? async (data: LoginRequest) => mockAuthTokens(data.email)
      : authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Welcome back!");
      router.push("/");
    },
    onError: () => {
      toast.error("Invalid email or password");
    },
  });

  const registerMutation = useMutation({
    mutationFn: IS_MOCK
      ? async (data: RegisterRequest) => mockAuthTokens(data.email, data.nickname)
      : authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Account created successfully!");
      router.push("/");
    },
    onError: () => {
      toast.error("Registration failed. Email may already exist.");
    },
  });

  const oauthLogin = useCallback(
    async (provider: OAuthProvider, code: string) => {
      try {
        const data = await authApi.oauthCallback(provider, code);
        setAuth(data.user, data.access_token, data.refresh_token);
        toast.success("Welcome back!");
        router.push("/");
      } catch {
        toast.error("OAuth login failed");
      }
    },
    [setAuth, router]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors
    } finally {
      clearAuth();
      toast.success("Logged out");
      router.push("/login");
    }
  }, [clearAuth, router]);

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    oauthLogin,
    logout: handleLogout,
  };
}
