"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  categories: Category[];
  selectedId?: number | null;
  onSelect: (categoryId: number | null) => void;
}

export function CategoryTabs({
  categories,
  selectedId,
  onSelect,
}: CategoryTabsProps) {
  const t = useTranslations("drama");

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          selectedId === null || selectedId === undefined
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        {t("all")}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selectedId === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
