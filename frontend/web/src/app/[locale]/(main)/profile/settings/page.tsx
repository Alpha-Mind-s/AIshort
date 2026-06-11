"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth-store";
import { LOCALES } from "@/lib/utils/constants";
import { useRouter, usePathname } from "@/lib/i18n/navigation";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const FLAGS: Record<string, string> = {
  en: "US", es: "ES", pt: "BR", ja: "JP", ko: "KR",
};

export default function SettingsPage() {
  const t = useTranslations("profile");
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (locale: string) => {
    updateUser({ language: locale });
    router.replace(pathname, { locale });
    toast.success("Language updated");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <h1 className="text-2xl font-bold">{t("settings")}</h1>

      {/* Language */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("language")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLanguageChange(loc)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                user?.language === loc
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span>{FLAGS[loc]}</span>
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Account info */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Email</span>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t("region")}</span>
            <p className="font-medium">{user?.region ?? "US"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Role</span>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
