import { getTranslations } from "next-intl/server";
import { serverGetDramaList } from "@/lib/mocks/data-access";
import { DramaGrid } from "@/components/drama/DramaGrid";
import { HeroBanner } from "@/components/drama/HeroBanner";
import { HomePageClient } from "./HomePageClient";

// Static data from mock (categories are not an API endpoint yet, so we hardcode)
const CATEGORIES = [
  { id: 1, name: "Romance", slug: "romance" },
  { id: 2, name: "Action", slug: "action" },
  { id: 3, name: "Comedy", slug: "comedy" },
  { id: 4, name: "Thriller", slug: "thriller" },
  { id: 5, name: "Fantasy", slug: "fantasy" },
];

export type HomePageData = {
  trending: { data: Drama[]; meta: PaginatedMeta };
  latest: { data: Drama[]; meta: PaginatedMeta };
};

export default async function HomePage() {
  const t = await getTranslations("home");

  // Fetch trending and latest dramas in parallel (BFF pattern)
  const [trending, latest] = await Promise.all([
    serverGetDramaList({ sort: "trending", page_size: 12 }),
    serverGetDramaList({ sort: "latest", page_size: 12 }),
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
      <HomePageClient categories={CATEGORIES} />
    </div>
  );
}
