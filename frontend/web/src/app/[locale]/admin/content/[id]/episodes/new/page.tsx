"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDramaDetail, createEpisode, completeUpload, type CreateEpisodeInput } from "@/lib/api/drama";
import { EpisodeForm, type EpisodeFormData } from "@/components/admin/EpisodeForm";
import type { UploadInfo } from "@/components/admin/VideoUploader";
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
    mutationFn: async ({ formData, uploadInfo }: { formData: EpisodeFormData; uploadInfo: UploadInfo }) => {
      // 1. Create episode first → get episode_id
      const episode = await createEpisode(dramaId, {
        episode_no: formData.episode_no,
        title: formData.title,
        duration: formData.duration,
        video_url: formData.video_url,
        subtitle_files: formData.subtitles.length > 0
          ? formData.subtitles.map((s) => ({ language: s.language, url: s.url }))
          : undefined,
      });

      // 2. Complete upload with episode_id → triggers transcode + AI jobs
      if (uploadInfo.upload_id) {
        await completeUpload({
          upload_id: uploadInfo.upload_id,
          episode_id: episode.id,
          file_size: uploadInfo.file_size,
        });
      }

      return episode;
    },
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
        onSubmit={async (formData: EpisodeFormData, uploadInfo: UploadInfo) => {
          await mutation.mutateAsync({ formData, uploadInfo });
        }}
        isSubmitting={mutation.isPending}
      />
    </div>
  );
}
