"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getDramaList } from "@/lib/api/drama";
import { DramaGrid, DramaGridSkeleton } from "@/components/drama/DramaGrid";
import { CategoryTabs } from "@/components/drama/CategoryTabs";

interface Props {
  categories: { id: number; name: string; slug: string }[];
}

export function HomePageClient({ categories }: Props) {
  const t = useTranslations("home");
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dramas", "by-category", categoryId],
    queryFn: () =>
      getDramaList({
        category_id: categoryId ?? undefined,
        sort: "popular",
        page_size: 12,
      }),
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 rounded-full bg-primary" />
        <h2 className="text-xl font-bold tracking-tight">{t("popular")}</h2>
      </div>
      <CategoryTabs
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />
      {isLoading ? (
        <DramaGridSkeleton count={6} />
      ) : (
        <DramaGrid dramas={data?.data ?? []} />
      )}
    </section>
  );
}
