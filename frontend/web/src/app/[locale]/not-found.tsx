"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("error");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground/30">{t("not_found_title")}</h1>
      <h2 className="text-xl font-semibold mt-4">{t("not_found_desc")}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm">
        {t("not_found_text")}
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {t("go_home")}
      </Link>
    </div>
  );
}
