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

  // Fetch trending, latest dramas and categories in parallel from real API
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Trending section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("trending")}</h2>
          <DramaGrid dramas={trending.data} />
        </section>

        {/* Latest section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("latest")}</h2>
          <DramaGrid dramas={latest.data} />
        </section>
      </div>

      {/* Client-only interactive filter section */}
      <HomePageClient categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
    </div>
  );
}
