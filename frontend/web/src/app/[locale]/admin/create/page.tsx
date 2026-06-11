"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { DramaForm, type DramaFormData } from "@/components/admin/DramaForm";
import { EpisodeForm, type EpisodeFormData } from "@/components/admin/EpisodeForm";
import type { Episode } from "@/lib/api/drama";
import { createDrama, createEpisode } from "@/lib/api/drama";
import { CheckCircle, Plus, Trash2, Play } from "lucide-react";

type Step = "drama" | "episodes";

interface CreatedEpisode {
  id: number;
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
}

export default function CreateDramaPage() {
  const t = useTranslations("admin");
  const router = useRouter();

  const [step, setStep] = useState<Step>("drama");
  const [dramaId, setDramaId] = useState<number | null>(null);
  const [episodes, setEpisodes] = useState<CreatedEpisode[]>([]);
  const [dramaTitle, setDramaTitle] = useState("");
  const [isSubmittingDrama, setIsSubmittingDrama] = useState(false);
  const [isSubmittingEpisode, setIsSubmittingEpisode] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ---- Step 1: Create Drama ----
  const handleCreateDrama = useCallback(async (data: DramaFormData) => {
    setIsSubmittingDrama(true);
    setError("");
    try {
      const drama = await createDrama({
        title: data.title,
        description: data.description,
        cover_url: data.cover_url,
        category_id: data.category_id,
        tags: data.tags,
      });
      setDramaId(drama.id);
      setDramaTitle(drama.title);
      setStep("episodes");
      setSuccessMsg(t("create_drama") + " — " + drama.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create drama");
    } finally {
      setIsSubmittingDrama(false);
    }
  }, [t]);

  // ---- Step 2: Add Episode ----
  const handleAddEpisode = useCallback(async (data: EpisodeFormData) => {
    if (!dramaId) return;
    setIsSubmittingEpisode(true);
    setError("");
    try {
      const ep = await createEpisode(dramaId, {
        episode_no: data.episode_no,
        title: data.title,
        duration: data.duration,
        video_url: data.video_url,
        subtitle_files: data.subtitles.length > 0 ? data.subtitles : undefined,
      });
      setEpisodes((prev) => [
        ...prev,
        {
          id: ep.id,
          episode_no: ep.episode_no,
          title: ep.title,
          duration: ep.duration,
          video_url: ep.video_url,
        },
      ]);
      setSuccessMsg(`Episode ${ep.episode_no} "${ep.title}" added`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add episode");
    } finally {
      setIsSubmittingEpisode(false);
    }
  }, [dramaId]);

  const handleRemoveEpisode = useCallback((id: number) => {
    setEpisodes((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ---- Done ----
  const handleFinish = useCallback(() => {
    router.push("/admin/content");
  }, [router]);

  const nextEpisodeNo =
    episodes.length > 0
      ? Math.max(...episodes.map((e) => e.episode_no)) + 1
      : 1;

  // ---- styles ----
  const stepClasses = (s: Step) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      step === s
        ? "bg-primary text-primary-foreground"
        : step === "episodes" && s === "drama"
          ? "bg-green-500/20 text-green-600"
          : "bg-muted text-muted-foreground"
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t("create_drama")}</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <div className={stepClasses("drama")}>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background/20 text-xs font-bold">1</span>
          Drama Info
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={stepClasses("episodes")}>
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background/20 text-xs font-bold">2</span>
          {t("episodes")} ({episodes.length})
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError("")} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-600 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Step 1: Drama Form */}
      {step === "drama" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <DramaForm
            onSubmit={handleCreateDrama}
            isSubmitting={isSubmittingDrama}
            submitLabel={t("create_drama")}
          />
        </div>
      )}

      {/* Step 2: Episodes */}
      {step === "episodes" && (
        <div className="space-y-6">
          {/* Already added episodes */}
          {episodes.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-4">
                {t("episodes")} ({episodes.length})
              </h2>
              <div className="space-y-2">
                {episodes
                  .sort((a, b) => a.episode_no - b.episode_no)
                  .map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <Play className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Ep.{ep.episode_no} — {ep.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ep.duration}s &middot; {ep.video_url.slice(0, 50)}...
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveEpisode(ep.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Add episode form */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t("add_episode")}</h2>
            </div>
            <EpisodeForm
              key={`ep-${episodes.length}`}
              nextEpisodeNo={nextEpisodeNo}
              onSubmit={handleAddEpisode}
              isSubmitting={isSubmittingEpisode}
            />
          </div>

          {/* Finish button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("drama")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; {t("edit_drama")}
            </button>
            <button
              onClick={handleFinish}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              {t("save")} &amp; {t("view_on_site")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
