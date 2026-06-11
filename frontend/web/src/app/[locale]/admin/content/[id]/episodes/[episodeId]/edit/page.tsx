"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getEpisode,
  updateEpisode,
  type UpdateEpisodeInput,
} from "@/lib/api/drama";
import { EpisodeForm, type EpisodeFormData } from "@/components/admin/EpisodeForm";
import { toast } from "sonner";
import { Link } from "@/lib/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function EditEpisodePage() {
  const params = useParams();
  const router = useRouter();
  const dramaId = Number(params.id);
  const episodeId = Number(params.episodeId);

  const { data: episode, isLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: () => getEpisode(episodeId),
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateEpisodeInput) => updateEpisode(episodeId, data),
    onSuccess: () => {
      toast.success("Episode updated");
      router.push(`/admin/content/${dramaId}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update episode");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Episode not found</h2>
        <Link
          href={`/admin/content/${dramaId}`}
          className="text-sm text-primary hover:opacity-80 mt-2 inline-block"
        >
          Back to drama
        </Link>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Edit Episode</h1>
          <p className="text-sm text-muted-foreground">
            Episode {episode.episode_no}: {episode.title}
          </p>
        </div>
      </div>

      <EpisodeForm
        nextEpisodeNo={episode.episode_no}
        defaultValues={{
          episode_no: episode.episode_no,
          title: episode.title,
          duration: episode.duration,
          video_url: episode.video_url,
          subtitles: [],
        }}
        onSubmit={async (data: EpisodeFormData) => {
          await mutation.mutateAsync({
            episode_no: data.episode_no,
            title: data.title,
            duration: data.duration,
            video_url: data.video_url,
          });
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
