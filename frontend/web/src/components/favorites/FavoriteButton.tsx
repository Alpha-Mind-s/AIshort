"use client";

import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  dramaId: number;
  className?: string;
  variant?: "icon" | "button";
}

export function FavoriteButton({
  dramaId,
  className,
  variant = "icon",
}: FavoriteButtonProps) {
  const t = useTranslations("common");
  const tf = useTranslations("favorites");

  const { isFavorited, toggleFavorite, isToggling } = useFavorites({
    added: tf("toast.added"),
    addFailed: tf("toast.add_failed"),
    removed: tf("toast.removed"),
    removeFailed: tf("toast.remove_failed"),
    loginRequired: tf("toast.login_required"),
  });

  const favorited = isFavorited(dramaId);

  if (variant === "button") {
    return (
      <button
        onClick={() => toggleFavorite(dramaId)}
        disabled={isToggling}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
          favorited
            ? "border-primary bg-primary/10 text-primary"
            : "border-border hover:bg-muted",
          className
        )}
      >
        <Heart
          className={cn("h-4 w-4", favorited && "fill-current")}
        />
        {favorited ? t("favorited") : t("add_to_favorites")}
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleFavorite(dramaId)}
      disabled={isToggling}
      className={cn(
        "inline-flex items-center justify-center rounded-full h-10 w-10 transition-colors hover:bg-muted",
        favorited && "text-red-500",
        className
      )}
      aria-label={favorited ? t("remove_from_favorites") : t("add_to_favorites")}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          favorited && "fill-current scale-110"
        )}
      />
    </button>
  );
}
