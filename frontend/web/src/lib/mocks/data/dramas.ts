export const mockCategories = [
  { id: 1, name: "Romance", slug: "romance", parent_id: null, sort_order: 1 },
  { id: 2, name: "Action", slug: "action", parent_id: null, sort_order: 2 },
  { id: 3, name: "Comedy", slug: "comedy", parent_id: null, sort_order: 3 },
  { id: 4, name: "Thriller", slug: "thriller", parent_id: null, sort_order: 4 },
  { id: 5, name: "Fantasy", slug: "fantasy", parent_id: null, sort_order: 5 },
];

export const mockDramas = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: [
    "Love in the Rain",
    "The Last Stand",
    "Laugh Out Loud",
    "Dark Shadows",
    "Dragon Realm",
    "Secret Garden",
    "Iron Fist",
    "Funny Business",
    "Midnight Chase",
    "Wizard's Quest",
    "Summer of Love",
    "Code Red",
    "Family Ties",
    "Ghost Protocol",
    "Starfall Chronicles",
  ][i],
  description: `A captivating short drama series. Episode ${i + 1} of an exciting story that will keep you on the edge of your seat.`,
  cover_url: `https://picsum.photos/seed/drama${i + 1}/400/600`,
  category_id: (i % 5) + 1,
  creator: {
    id: 3,
    email: "creator@example.com",
    nickname: "Creator",
    avatar_url: null,
    role: "creator" as const,
    language: "zh",
    region: "CN",
    created_at: "2026-01-10T12:00:00Z",
  },
  total_episodes: 5,
  status: "published" as const,
  tags: [["romance"], ["action", "thriller"], ["comedy"], ["mystery"], ["fantasy", "adventure"]][
    i % 5
  ],
  release_at: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
  created_at: "2026-01-01T00:00:00Z",
  view_count: Math.floor(Math.random() * 500000) + 10000,
  like_count: Math.floor(Math.random() * 50000) + 1000,
  favorite_count: Math.floor(Math.random() * 20000) + 500,
}));

export const mockEpisodes = mockDramas.flatMap((drama) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: drama.id * 100 + i + 1,
    drama_id: drama.id,
    episode_no: i + 1,
    title: `${drama.title} — Episode ${i + 1}`,
    duration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
    video_url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    status: "ready" as const,
    localizations: [
      {
        id: drama.id * 1000 + i * 10 + 1,
        episode_id: drama.id * 100 + i + 1,
        language: "en",
        title_translated: `${drama.title} — Episode ${i + 1}`,
        dub_url: null,
        subtitle_url: "https://test-videos.co.uk/vids/bigbuckbunny/subtitles/Big_Buck_Bunny_720_10s_1MB.en.vtt",
        lip_sync_url: null,
        status: "completed" as const,
      },
      {
        id: drama.id * 1000 + i * 10 + 2,
        episode_id: drama.id * 100 + i + 1,
        language: "es",
        title_translated: `${drama.title} — Episodio ${i + 1}`,
        dub_url: null,
        subtitle_url: null,
        lip_sync_url: null,
        status: "completed" as const,
      },
    ],
    created_at: "2026-01-15T00:00:00Z",
  }))
);

export const mockVideoAssets: Record<number, Record<string, { url: string; bitrate: number }>> =
  {};
mockEpisodes.forEach((ep) => {
  mockVideoAssets[ep.id] = {
    "1080p": {
      url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4",
      bitrate: 5000,
    },
    "720p": {
      url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
      bitrate: 2500,
    },
    "480p": {
      url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/480/Big_Buck_Bunny_480_10s_1MB.mp4",
      bitrate: 1200,
    },
  };
});
