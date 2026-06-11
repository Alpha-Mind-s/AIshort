"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDramaDetail, createEpisode, type CreateEpisodeInput } from "@/lib/api/drama";
import { EpisodeForm, type EpisodeFormData } from "@/components/admin/EpisodeForm";
import { toast } from "sonner";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function AddEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const dramaId = Number(params.id);

  const { data: drama } = useQuery({
    queryKey: ["drama", dramaId],
    queryFn: () => getDramaDetail(dramaId),
  });

  const nextEpisodeNo = (drama?.total_episodes ?? 0) + 1;

  const mutation = useMutation({
    mutationFn: (data: CreateEpisodeInput) => createEpisode(dramaId, data),
    onSuccess: () => {
      toast.success("Episode added");
      router.push(`/admin/content/${dramaId}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add episode");
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/content/${dramaId}`}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Episode</h1>
          {drama && (
            <p className="text-sm text-muted-foreground">
              {drama.title} — currently {drama.total_episodes} episode(s)
            </p>
          )}
        </div>
      </div>

      <EpisodeForm
        nextEpisodeNo={nextEpisodeNo}
        onSubmit={async (data: EpisodeFormData) => {
          await mutation.mutateAsync({
            episode_no: data.episode_no,
            title: data.title,
            duration: data.duration,
            video_url: data.video_url,
            subtitle_files: data.subtitles.length > 0
              ? data.subtitles.map((s) => ({ language: s.language, url: s.url }))
              : undefined,
          });
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
