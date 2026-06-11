/// Shared Drama model — used across features.
///
/// Mirrors the Go backend Drama struct from the OpenAPI spec.
class Drama {
  final int id;
  final String title;
  final String description;
  final String coverUrl;
  final int categoryId;
  final int totalEpisodes;
  final List<String> tags;
  final int viewCount;
  final int likeCount;
  final String status;
  final String releaseAt;
  final String createdAt;

  const Drama({
    required this.id,
    required this.title,
    required this.description,
    required this.coverUrl,
    required this.categoryId,
    required this.totalEpisodes,
    required this.tags,
    required this.viewCount,
    required this.likeCount,
    required this.status,
    required this.releaseAt,
    required this.createdAt,
  });

  factory Drama.fromJson(Map<String, dynamic> json) => Drama(
    id: json['id'] as int? ?? 0,
    title: json['title'] as String? ?? '',
    description: json['description'] as String? ?? '',
    coverUrl: json['cover_url'] as String? ?? '',
    categoryId: json['category_id'] as int? ?? 0,
    totalEpisodes: json['total_episodes'] as int? ?? 0,
    tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
    viewCount: json['view_count'] as int? ?? 0,
    likeCount: json['like_count'] as int? ?? 0,
    status: json['status'] as String? ?? 'draft',
    releaseAt: json['release_at'] as String? ?? '',
    createdAt: json['created_at'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'title': title, 'description': description,
    'cover_url': coverUrl, 'category_id': categoryId,
    'total_episodes': totalEpisodes, 'tags': tags,
    'view_count': viewCount, 'like_count': likeCount,
    'status': status, 'release_at': releaseAt, 'created_at': createdAt,
  };
}

/// Episode model.
class Episode {
  final int id;
  final int dramaId;
  final int episodeNo;
  final String title;
  final int duration;
  final String videoUrl;
  final String status;
  final List<Localization> localizations;

  const Episode({
    required this.id, required this.dramaId, required this.episodeNo,
    required this.title, required this.duration, required this.videoUrl,
    required this.status, this.localizations = const [],
  });

  factory Episode.fromJson(Map<String, dynamic> json) => Episode(
    id: json['id'] as int? ?? 0,
    dramaId: json['drama_id'] as int? ?? 0,
    episodeNo: json['episode_no'] as int? ?? 0,
    title: json['title'] as String? ?? '',
    duration: json['duration'] as int? ?? 0,
    videoUrl: json['video_url'] as String? ?? '',
    status: json['status'] as String? ?? 'processing',
    localizations: (json['localizations'] as List<dynamic>?)
        ?.map((e) => Localization.fromJson(e as Map<String, dynamic>)).toList() ?? [],
  );
}

/// Localization info for an episode.
class Localization {
  final int id;
  final int episodeId;
  final String language;
  final String? dubUrl;
  final String? subtitleUrl;
  final String? lipSyncUrl;
  final String status;

  const Localization({
    required this.id, required this.episodeId, required this.language,
    this.dubUrl, this.subtitleUrl, this.lipSyncUrl, required this.status,
  });

  factory Localization.fromJson(Map<String, dynamic> json) => Localization(
    id: json['id'] as int? ?? 0,
    episodeId: json['episode_id'] as int? ?? 0,
    language: json['language'] as String? ?? '',
    dubUrl: json['dub_url'] as String?,
    subtitleUrl: json['subtitle_url'] as String?,
    lipSyncUrl: json['lip_sync_url'] as String?,
    status: json['status'] as String? ?? 'pending',
  );
}
