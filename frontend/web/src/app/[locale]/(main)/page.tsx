import { getTranslations } from "next-intl/server";
import type { Drama, PaginatedMeta, Category } from "@/lib/api/drama";
import { DramaGrid } from "@/components/drama/DramaGrid";
import { HeroBanner } from "@/components/drama/HeroBanner";
import { HomePageClient } from "./HomePageClient";

const API_BASE = process.env.API_GATEWAY
  ? `http://${process.env.API_GATEWAY}/api/v1`
  : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  const json = await res.json();
  return json.code === 0 ? (json.data ?? []) : [];
}

async function fetchDramaList(
  sort: "trending" | "latest" | "popular",
  pageSize = 12
): Promise<{ data: Drama[]; meta: PaginatedMeta }> {
  const url = `${API_BASE}/dramas?sort=${sort}&page_size=${pageSize}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return { data: [], meta: { page: 1, page_size: pageSize, total: 0 } };
  const json = await res.json();
  return { data: json.data ?? [], meta: json.meta };
}

export default async function HomePage() {
  const t = await getTranslations("home");

  const [trending, latest, categories] = await Promise.all([
    fetchDramaList("trending"),
    fetchDramaList("latest"),
    fetchCategories(),
  ]);

  const heroDrama = trending.data[0];

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      {heroDrama && <HeroBanner drama={heroDrama} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* Trending section */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1 w-8 rounded-full bg-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t("trending")}</h2>
          </div>
          <DramaGrid dramas={trending.data} />
        </section>

        {/* Latest section */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1 w-8 rounded-full bg-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t("latest")}</h2>
          </div>
          <DramaGrid dramas={latest.data} />
        </section>
      </div>

      {/* Client-only category filter section */}
      <HomePageClient categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
