"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDramaList, updateDramaStatus, type Drama } from "@/lib/api/drama";
import { formatDate } from "@/lib/utils/format";
import { Check, X, Pencil, Plus } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { toast } from "sonner";

export default function AdminContentPage() {
  const t = useTranslations("admin");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content-all"],
    queryFn: () => getDramaList({ sort: "latest", page_size: 50 }),
  });

  const dramas = data?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: number) => updateDramaStatus(id, "published"),
    onSuccess: () => {
      toast.success("Drama published");
      queryClient.invalidateQueries({ queryKey: ["admin-content-all"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => updateDramaStatus(id, "archived"),
    onSuccess: () => {
      toast.success("Drama archived");
      queryClient.invalidateQueries({ queryKey: ["admin-content-all"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to archive");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("content")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dramas.length} drama(s) total
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Create Drama
        </Link>
      </div>

      {dramas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <p>No dramas yet.</p>
          <Link
            href="/admin/content/new"
            className="text-sm text-primary hover:opacity-80"
          >
            Create your first drama
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {dramas.map((drama: Drama) => (
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
                  <span
                    className={`capitalize font-medium ${
                      drama.status === "published"
                        ? "text-green-500"
                        : drama.status === "draft"
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {drama.status}
                  </span>
                  {drama.created_at && <span>{formatDate(drama.created_at)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/content/${drama.id}`}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
                {drama.status !== "published" && (
                  <button
                    onClick={() => approveMutation.mutate(drama.id)}
                    disabled={approveMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                    {t("approve")}
                  </button>
                )}
                {drama.status !== "archived" && (
                  <button
                    onClick={() => rejectMutation.mutate(drama.id)}
                    disabled={rejectMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
