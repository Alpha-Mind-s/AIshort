"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { mockDramas } from "@/lib/mocks/data/dramas";
import { formatDate } from "@/lib/utils/format";
import { Check, X } from "lucide-react";

function getPendingDramas() {
  return Promise.resolve(
    mockDramas.filter((d) => d.status === "draft" || d.status === "reviewing")
  );
}

export default function AdminContentPage() {
  const t = useTranslations("admin");

  const { data: dramas } = useQuery({
    queryKey: ["admin-content"],
    queryFn: getPendingDramas,
  });

  const items = dramas ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("content")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No content pending review
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((drama) => (
            <div
              key={drama.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{drama.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {drama.description}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{drama.total_episodes} episodes</span>
                  <span className="capitalize">{drama.status}</span>
                  <span>{formatDate(drama.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                  <Check className="h-3 w-3" />
                  {t("approve")}
                </button>
                <button className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity">
                  <X className="h-3 w-3" />
                  {t("reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
