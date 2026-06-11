"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@/lib/auth/schemas";
import { VideoUploader } from "./VideoUploader";
import { X, Plus } from "lucide-react";

const episodeFormSchema = z.object({
  episode_no: z.number().min(1, "Episode number is required"),
  title: z.string().min(1, "Episode title is required").max(200),
  duration: z.number().min(1, "Duration is required"),
  video_url: z.string().min(1, "Video is required"),
  subtitles: z.array(
    z.object({
      language: z.string().min(1),
      url: z.string().min(1),
    })
  ),
});

export type EpisodeFormData = z.infer<typeof episodeFormSchema>;

interface EpisodeFormProps {
  defaultValues?: Partial<EpisodeFormData>;
  nextEpisodeNo: number;
  onSubmit: (data: EpisodeFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

export function EpisodeForm({
  defaultValues,
  nextEpisodeNo,
  onSubmit,
  isSubmitting = false,
}: EpisodeFormProps) {
  const t = useTranslations("admin");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeFormSchema),
    defaultValues: {
      episode_no: nextEpisodeNo,
      title: "",
      duration: 120,
      video_url: "",
      subtitles: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "subtitles" });
  const videoUrl = watch("video_url");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Episode number */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("episode_no")}</label>
        <input
          type="number"
          {...register("episode_no", { valueAsNumber: true })}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {errors.episode_no && (
          <p className="text-xs text-destructive mt-1">{errors.episode_no.message}</p>
        )}
      </div>

      {/* Episode title */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("episode_title")}</label>
        <input
          {...register("title")}
          placeholder={t("episode_title_placeholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("duration_seconds")}</label>
        <input
          type="number"
          {...register("duration", { valueAsNumber: true })}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {errors.duration && (
          <p className="text-xs text-destructive mt-1">{errors.duration.message}</p>
        )}
      </div>

      {/* Video upload */}
      <div>
        <label className="block text-sm font-medium mb-2">{t("upload_video")}</label>
        <VideoUploader
          value={videoUrl || undefined}
          onChange={(url, duration) => {
            setValue("video_url", url);
            setValue("duration", duration || 120);
          }}
        />
        {errors.video_url && (
          <p className="text-xs text-destructive mt-1">{errors.video_url.message}</p>
        )}
      </div>

      {/* Subtitles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t("subtitles")}</label>
          <button
            type="button"
            onClick={() => append({ language: "en", url: "" })}
            className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80"
          >
            <Plus className="h-3 w-3" />
            {t("add_subtitle")}
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground">No subtitles added</p>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <select
                {...register(`subtitles.${index}.language`)}
                className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <input
                {...register(`subtitles.${index}.url`)}
                placeholder="https://...subtitles.vtt"
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? t("saving") : t("add_episode")}
      </button>
    </form>
  );
}
