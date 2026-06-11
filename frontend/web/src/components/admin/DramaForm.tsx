"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@/lib/auth/schemas";
import { CoverUploader } from "./CoverUploader";
import { getCategories } from "@/lib/api/drama";
import { X } from "lucide-react";
import type { Drama } from "@/lib/api/drama";

const dramaFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  cover_url: z.string().min(1, "Cover image is required"),
  category_id: z.number().min(1, "Category is required"),
  tags: z.array(z.string()),
  status: z.enum(["draft", "published", "reviewing", "archived"]),
});

export type DramaFormData = z.infer<typeof dramaFormSchema>;

interface DramaFormProps {
  defaultValues?: Partial<DramaFormData> & { status?: Drama["status"] };
  onSubmit: (data: DramaFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function DramaForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel,
}: DramaFormProps) {
  const t = useTranslations("admin");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DramaFormData>({
    resolver: zodResolver(dramaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      cover_url: "",
      category_id: 1,
      tags: [],
      status: "draft",
      ...defaultValues,
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const tags = watch("tags");
  const [tagInput, setTagInput] = useState("");
  const coverUrl = watch("cover_url");

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Cover image */}
      <div>
        <label className="block text-sm font-medium mb-2">{t("upload_cover")}</label>
        <CoverUploader
          value={coverUrl || undefined}
          onChange={(url) => setValue("cover_url", url)}
        />
        {errors.cover_url && (
          <p className="text-xs text-destructive mt-1">{errors.cover_url.message}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("title")}</label>
        <input
          {...register("title")}
          placeholder={t("title_placeholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("description")}</label>
        <textarea
          {...register("description")}
          placeholder={t("description_placeholder")}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-vertical"
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("category")}</label>
        <select
          {...register("category_id", { valueAsNumber: true })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && (
          <p className="text-xs text-destructive mt-1">{errors.category_id.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("tags")}</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={t("tags_placeholder")}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="button"
            onClick={addTag}
            className="rounded-lg bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">{t("status")}</label>
        <select
          {...register("status")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="draft">{t("draft")}</option>
          <option value="reviewing">{t("reviewing")}</option>
          <option value="published">{t("published")}</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? t("saving") : submitLabel || t("save")}
      </button>
    </form>
  );
}
