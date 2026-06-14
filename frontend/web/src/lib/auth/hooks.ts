"use client";

import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@/lib/i18n/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import * as authApi from "@/lib/api/auth";
import type { OAuthProvider } from "@/lib/api/auth";

export interface AuthToastMessages {
  welcomeBack: string;
  invalidCredentials: string;
  accountCreated: string;
  registrationFailed: string;
  oauthUnavailable: string;
  loggedOut: string;
}

export function useAuth(tMessages?: AuthToastMessages) {
  const msg = tMessages ?? {
    welcomeBack: "Welcome back!",
    invalidCredentials: "Invalid email or password",
    accountCreated: "Account created successfully!",
    registrationFailed: "Registration failed. Email may already exist.",
    oauthUnavailable: "OAuth login is not available yet. Please use email login.",
    loggedOut: "Logged out",
  };

  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success(msg.welcomeBack);
      router.push("/");
    },
    onError: () => {
      toast.error(msg.invalidCredentials);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success(msg.accountCreated);
      router.push("/");
    },
    onError: () => {
      toast.error(msg.registrationFailed);
    },
  });

  const oauthLogin = useCallback(
    async (provider: OAuthProvider, code: string) => {
      try {
        const data = await authApi.oauthCallback(provider, code);
        setAuth(data.user, data.access_token, data.refresh_token);
        toast.success(msg.welcomeBack);
        router.push("/");
      } catch {
        toast.error(msg.oauthUnavailable);
        router.push("/login");
      }
    },
    [setAuth, router, msg]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors
    } finally {
      clearAuth();
      toast.success(msg.loggedOut);
      router.push("/login");
    }
  }, [clearAuth, router, msg]);

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
