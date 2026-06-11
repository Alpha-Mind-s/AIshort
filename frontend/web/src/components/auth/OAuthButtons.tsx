"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { OAuthProvider } from "@/lib/api/auth";

const OAUTH_ICONS: Record<OAuthProvider, string> = {
  google: "G",
  apple: "",
  facebook: "f",
};

export function OAuthButtons() {
  const t = useTranslations("auth");

  const handleOAuth = (provider: OAuthProvider) => {
    // OAuth is not yet implemented on the backend — show a toast instead
    // of redirecting to a callback page that will fail.
    toast.info(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is coming soon. Please use email login.`);
  };

  const providers: OAuthProvider[] = ["google", "apple", "facebook"];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            {t("or_continue_with")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleOAuth(provider)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <span className="font-semibold">{OAUTH_ICONS[provider] || provider.charAt(0).toUpperCase()}</span>
            <span className="ml-2 hidden sm:inline">{t(provider)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
