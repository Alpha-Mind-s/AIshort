export const mockCategories = [
  { id: 1, name: "Romance", slug: "romance", parent_id: null, sort_order: 1 },
  { id: 2, name: "Action", slug: "action", parent_id: null, sort_order: 2 },
  { id: 3, name: "Comedy", slug: "comedy", parent_id: null, sort_order: 3 },
  { id: 4, name: "Thriller", slug: "thriller", parent_id: null, sort_order: 4 },
  { id: 5, name: "Fantasy", slug: "fantasy", parent_id: null, sort_order: 5 },
];

export interface MockDrama {
  id: number;
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  creator: {
    id: number;
    email: string;
    nickname: string;
    avatar_url: string | null;
    role: string;
    language: string;
    region: string;
    created_at: string;
  };
  total_episodes: number;
  status: "draft" | "published" | "reviewing" | "archived";
  tags: string[];
  release_at: string;
  created_at: string;
  view_count: number;
  like_count: number;
  favorite_count: number;
}

export interface MockEpisode {
  id: number;
  drama_id: number;
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  status: "processing" | "ready" | "failed";
  localizations: MockLocalization[];
  created_at: string;
}

export interface MockLocalization {
  id: number;
  episode_id: number;
  language: string;
  title_translated: string;
  dub_url: string | null;
  subtitle_url: string | null;
  lip_sync_url: string | null;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface MockVideoAsset {
  resolution?: string;
  url: string;
  bitrate: number;
}

const TITLES = [
  "Love in the Rain", "The Last Stand", "Laugh Out Loud",
  "Dark Shadows", "Dragon Realm", "Secret Garden",
  "Iron Fist", "Funny Business", "Midnight Chase",
  "Wizard's Quest", "Summer of Love", "Code Red",
  "Family Ties", "Ghost Protocol", "Starfall Chronicles",
];

const TAG_SETS = [
  ["romance"], ["action", "thriller"], ["comedy"], ["mystery"], ["fantasy", "adventure"],
];

// ---- mutable store ----

let _nextDramaId = 16;
let _nextEpisodeId = 1600;
let _nextLocalizationId = 16000;

export let mockDramas: MockDrama[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: TITLES[i],
  description: `A captivating short drama series. Episode ${i + 1} of an exciting story that will keep you on the edge of your seat.`,
  cover_url: `https://picsum.photos/seed/drama${i + 1}/400/600`,
  category_id: (i % 5) + 1,
  creator: {
    id: 3, email: "creator@example.com", nickname: "Creator",
    avatar_url: null, role: "creator" as const,
    language: "zh", region: "CN", created_at: "2026-01-10T12:00:00Z",
  },
  total_episodes: 5,
  status: "published" as const,
  tags: TAG_SETS[i % 5],
  release_at: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
  created_at: "2026-01-01T00:00:00Z",
  view_count: Math.floor(Math.random() * 500000) + 10000,
  like_count: Math.floor(Math.random() * 50000) + 1000,
  favorite_count: Math.floor(Math.random() * 20000) + 500,
}));

export let mockEpisodes: MockEpisode[] = mockDramas.flatMap((drama) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: drama.id * 100 + i + 1,
    drama_id: drama.id,
    episode_no: i + 1,
    title: `${drama.title} — Episode ${i + 1}`,
    duration: Math.floor(Math.random() * 300) + 120,
    video_url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    status: "ready" as const,
    localizations: [
      {
        id: drama.id * 1000 + i * 10 + 1, episode_id: drama.id * 100 + i + 1,
        language: "en", title_translated: `${drama.title} — Episode ${i + 1}`,
        dub_url: null,
        subtitle_url: "https://test-videos.co.uk/vids/bigbuckbunny/subtitles/Big_Buck_Bunny_720_10s_1MB.en.vtt",
        lip_sync_url: null, status: "completed" as const,
      },
      {
        id: drama.id * 1000 + i * 10 + 2, episode_id: drama.id * 100 + i + 1,
        language: "es", title_translated: `${drama.title} — Episodio ${i + 1}`,
        dub_url: null, subtitle_url: null, lip_sync_url: null,
        status: "completed" as const,
      },
    ],
    created_at: "2026-01-15T00:00:00Z",
  }))
);

export let mockVideoAssets: Record<number, Record<string, MockVideoAsset>> = {};
mockEpisodes.forEach((ep) => {
  mockVideoAssets[ep.id] = {
    "1080p": { url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4", bitrate: 5000 },
    "720p": { url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4", bitrate: 2500 },
    "480p": { url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/480/Big_Buck_Bunny_480_10s_1MB.mp4", bitrate: 1200 },
  };
});

// ---- CRUD helpers ----

export function createDrama(input: {
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  tags: string[];
  status?: "draft" | "published" | "reviewing" | "archived";
}): MockDrama {
  const now = new Date().toISOString();
  const drama: MockDrama = {
    id: _nextDramaId++,
    title: input.title,
    description: input.description,
    cover_url: input.cover_url,
    category_id: input.category_id,
    creator: {
      id: 999, email: "admin@example.com", nickname: "Admin",
      avatar_url: null, role: "admin" as const,
      language: "en", region: "US", created_at: now,
    },
    total_episodes: 0,
    status: input.status ?? "draft",
    tags: input.tags,
    release_at: now,
    created_at: now,
    view_count: 0,
    like_count: 0,
    favorite_count: 0,
  };
  mockDramas.push(drama);
  return drama;
}

export function updateDrama(id: number, input: Partial<{
  title: string;
  description: string;
  cover_url: string;
  category_id: number;
  tags: string[];
  status: "draft" | "published" | "reviewing" | "archived";
}>): MockDrama | null {
  const idx = mockDramas.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const prev = mockDramas[idx];
  mockDramas[idx] = { ...prev, ...input };
  return mockDramas[idx];
}

export function deleteDrama(id: number): boolean {
  const idx = mockDramas.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  mockDramas.splice(idx, 1);
  mockEpisodes = mockEpisodes.filter((e) => e.drama_id !== id);
  return true;
}

export function addEpisode(dramaId: number, input: {
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  subtitle_files?: { language: string; url: string }[];
}): MockEpisode | null {
  const drama = mockDramas.find((d) => d.id === dramaId);
  if (!drama) return null;

  const epId = _nextEpisodeId++;
  const now = new Date().toISOString();

  const localizations: MockLocalization[] = [
    {
      id: _nextLocalizationId++, episode_id: epId,
      language: "en", title_translated: input.title,
      dub_url: null, subtitle_url: null, lip_sync_url: null,
      status: "completed" as const,
    },
  ];

  if (input.subtitle_files) {
    for (const sub of input.subtitle_files) {
      localizations.push({
        id: _nextLocalizationId++, episode_id: epId,
        language: sub.language, title_translated: input.title,
        dub_url: null, subtitle_url: sub.url, lip_sync_url: null,
        status: "completed" as const,
      });
    }
  }

  const ep: MockEpisode = {
    id: epId, drama_id: dramaId,
    episode_no: input.episode_no,
    title: input.title,
    duration: input.duration,
    video_url: input.video_url,
    status: "ready",
    localizations,
    created_at: now,
  };

  mockEpisodes.push(ep);

  // Add video assets for this episode
  mockVideoAssets[epId] = {
    "1080p": { url: input.video_url, bitrate: 5000 },
    "720p": { url: input.video_url, bitrate: 2500 },
    "480p": { url: input.video_url, bitrate: 1200 },
  };

  // Update episode count
  mockDramas = mockDramas.map((d) =>
    d.id === dramaId ? { ...d, total_episodes: d.total_episodes + 1 } : d
  );

  return ep;
}

export function updateEpisode(id: number, input: Partial<{
  episode_no: number;
  title: string;
  duration: number;
  video_url: string;
  status: "processing" | "ready" | "failed";
}>): MockEpisode | null {
  const idx = mockEpisodes.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  mockEpisodes[idx] = { ...mockEpisodes[idx], ...input };
  return mockEpisodes[idx];
}

export function deleteEpisode(id: number): boolean {
  const idx = mockEpisodes.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  const ep = mockEpisodes[idx];
  mockEpisodes.splice(idx, 1);
  delete mockVideoAssets[id];
  mockDramas = mockDramas.map((d) =>
    d.id === ep.drama_id ? { ...d, total_episodes: Math.max(0, d.total_episodes - 1) } : d
  );
  return true;
}
