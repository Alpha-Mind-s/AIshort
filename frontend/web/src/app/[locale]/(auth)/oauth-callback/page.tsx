"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useAuth } from "@/lib/auth/hooks";
import type { OAuthProvider } from "@/lib/api/auth";

export default function OAuthCallbackPage() {
  const t = useTranslations("error");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { oauthLogin } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const provider = searchParams.get("provider") as OAuthProvider | null;
    const code = searchParams.get("code");

    if (provider && code) {
      oauthLogin(provider, code);
    } else {
      router.push("/login");
    }
  }, [searchParams, router, oauthLogin]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{t("signing_in")}</p>
    </div>
  );
}
