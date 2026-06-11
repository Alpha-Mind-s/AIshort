"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/lib/i18n/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import * as authApi from "@/lib/api/auth";
import type { OAuthProvider } from "@/lib/api/auth";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
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
    mutationFn: authApi.register,
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
