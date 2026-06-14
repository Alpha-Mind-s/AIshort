"use client";

import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/use-favorites";
import { DramaGrid, DramaGridSkeleton } from "@/components/drama/DramaGrid";
import { Heart } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

export default function FavoritesPage() {
  const t = useTranslations("favorites");
  const { favorites, isLoading } = useFavorites({
    added: t("toast.added"),
    addFailed: t("toast.add_failed"),
    removed: t("toast.removed"),
    removeFailed: t("toast.remove_failed"),
    loginRequired: t("toast.login_required"),
  });

  const dramas = favorites
    .filter((f) => f.drama)
    .map((f) => f.drama!);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
        <DramaGridSkeleton count={6} />
      </div>
    );
  }

  if (dramas.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
          >
            {t("browse_dramas")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">{t("title")} ({dramas.length})</h1>
      <DramaGrid dramas={dramas} />
    </div>
  );
}
