"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-bold text-destructive">{t("title")}</h1>
      <h2 className="text-lg font-semibold mt-2">{t("description")}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {t("try_again")}
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border px-6 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          {t("go_home")}
        </Link>
      </div>
    </div>
  );
}
