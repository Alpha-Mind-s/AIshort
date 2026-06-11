"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDramaDetail,
  getDramaEpisodes,
  updateDrama,
  updateDramaStatus,
  deleteDrama,
  deleteEpisode,
  type Drama,
  type Episode,
} from "@/lib/api/drama";
import { DramaForm, type DramaFormData } from "@/components/admin/DramaForm";
import { EpisodeListEditor } from "@/components/admin/EpisodeListEditor";
import { toast } from "sonner";
import { Link } from "@/lib/i18n/navigation";
import { Plus, ArrowLeft } from "lucide-react";

export default function EditDramaPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dramaId = Number(params.id);

  const { data: drama, isLoading } = useQuery({
    queryKey: ["drama", dramaId],
    queryFn: () => getDramaDetail(dramaId),
  });

  const { data: episodesRaw } = useQuery({
    queryKey: ["episodes", dramaId],
    queryFn: () => getDramaEpisodes(dramaId),
  });
  const episodes = episodesRaw ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: DramaFormData) =>
      updateDrama(dramaId, {
        title: data.title,
        description: data.description,
        cover_url: data.cover_url,
        category_id: data.category_id,
        tags: data.tags,
        status: data.status,
      }),
    onSuccess: () => {
      toast.success("Drama updated");
      queryClient.invalidateQueries({ queryKey: ["drama", dramaId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update drama");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => updateDramaStatus(dramaId, "published"),
    onSuccess: () => {
      toast.success("Drama published!");
      queryClient.invalidateQueries({ queryKey: ["drama", dramaId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    },
  });

  const deleteDramaMutation = useMutation({
    mutationFn: () => deleteDrama(dramaId),
    onSuccess: () => {
      toast.success("Drama deleted");
      router.push("/admin/content");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete drama");
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: (episodeId: number) => deleteEpisode(episodeId),
    onSuccess: () => {
      toast.success("Episode deleted");
      queryClient.invalidateQueries({ queryKey: ["episodes", dramaId] });
      queryClient.invalidateQueries({ queryKey: ["drama", dramaId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete episode");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Drama not found</h2>
        <Link
          href="/admin/content"
          className="text-sm text-primary hover:opacity-80 mt-2 inline-block"
        >
          Back to content
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/content"
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Drama</h1>
          <p className="text-sm text-muted-foreground">
            Manage drama details, episodes, and publishing status.
          </p>
        </div>
      </div>

      {/* Status badge + actions */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
        <span className="text-sm font-medium">Status:</span>
        <span
          className={`text-sm font-medium capitalize px-2 py-0.5 rounded ${
            drama.status === "published"
              ? "bg-green-500/10 text-green-500"
              : "bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {drama.status}
        </span>
        <div className="flex-1" />
        {drama.status !== "published" && (
          <button
            type="button"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {publishMutation.isPending ? "Publishing..." : "Publish"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this drama and all its episodes? This cannot be undone.")) {
              deleteDramaMutation.mutate();
            }
          }}
          disabled={deleteDramaMutation.isPending}
          className="rounded-lg bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
        >
          {deleteDramaMutation.isPending ? "Deleting..." : "Delete"}
        </button>
      </div>

      {/* Drama form */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Drama Details</h2>
        <DramaForm
          defaultValues={{
            title: drama.title,
            description: drama.description,
            cover_url: drama.cover_url,
            category_id: drama.category_id,
            tags: drama.tags,
            status: drama.status,
          }}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data);
          }}
          isSubmitting={updateMutation.isPending}
          submitLabel="Save Changes"
        />
      </section>

      {/* Episodes section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Episodes ({episodes?.length ?? 0})
          </h2>
          <Link
            href={`/admin/content/${dramaId}/episodes/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Episode
          </Link>
        </div>
        <EpisodeListEditor
          episodes={episodes}
          dramaId={dramaId}
          onDelete={(episodeId) => deleteEpisodeMutation.mutate(episodeId)}
          isDeleting={deleteEpisodeMutation.isPending ? deleteEpisodeMutation.variables : null}
        />
      </section>
    </div>
  );
}
