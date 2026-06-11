"use client";

import { useRouter } from "@/lib/i18n/navigation";
import { useMutation } from "@tanstack/react-query";
import { createDrama, type CreateDramaInput } from "@/lib/api/drama";
import { DramaForm, type DramaFormData } from "@/components/admin/DramaForm";
import { toast } from "sonner";

export default function CreateDramaPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (data: CreateDramaInput) => createDrama(data),
    onSuccess: (drama) => {
      toast.success("Drama created successfully");
      router.push(`/admin/content/${drama.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create drama");
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Drama</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a cover image and fill in the drama details.
        </p>
      </div>
      <DramaForm
        onSubmit={async (data) => {
          await mutation.mutateAsync({
            title: data.title,
            description: data.description,
            cover_url: data.cover_url,
            category_id: data.category_id,
            tags: data.tags,
          });
        }}
        isSubmitting={mutation.isPending}
        submitLabel="Create Drama"
      />
    </div>
  );
}
