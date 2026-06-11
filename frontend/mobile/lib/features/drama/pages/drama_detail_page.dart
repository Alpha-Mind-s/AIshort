import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:aishot_mobile/shared/models/drama.dart';

class DramaDetailPage extends StatelessWidget {
  final int dramaId;

  const DramaDetailPage({super.key, required this.dramaId});

  @override
  Widget build(BuildContext context) {
    // Mock: find drama by id
    final drama = _mockDramas.firstWhere((d) => d.id == dramaId, orElse: () => _mockDramas.first);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Header with cover image
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: drama.coverUrl,
                    fit: BoxFit.cover,
                    colorFilter: const ColorFilter.mode(Colors.black38, BlendMode.darken),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [Color(0xFF0A0A0B), Colors.transparent],
                      ),
                    ),
                  ),
                ],
              ),
              title: Text(drama.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  Text(drama.description, style: TextStyle(fontSize: 14, color: Colors.grey.shade400, height: 1.5)),
                  const SizedBox(height: 12),

                  // Stats row
                  Row(
                    children: [
                      _StatChip(icon: Icons.visibility_outlined, label: '${(drama.viewCount / 1000).toStringAsFixed(1)}K views'),
                      const SizedBox(width: 12),
                      _StatChip(icon: Icons.playlist_play, label: '${drama.totalEpisodes} episodes'),
                      const SizedBox(width: 12),
                      _StatChip(icon: Icons.thumb_up_outlined, label: '${(drama.likeCount / 1000).toStringAsFixed(1)}K'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Tags
                  Wrap(
                    spacing: 6, runSpacing: 6,
                    children: drama.tags.map((tag) => Chip(label: Text(tag, style: const TextStyle(fontSize: 11)), backgroundColor: Colors.white.withAlpha(12), side: BorderSide(color: Colors.white.withAlpha(20)), padding: EdgeInsets.zero, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap)).toList(),
                  ),
                  const SizedBox(height: 24),

                  // Episodes header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Episodes', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                      Text('${drama.totalEpisodes} total', style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Episodes list
                  ...List.generate(5, (i) {
                    return _EpisodeTile(
                      episodeNo: i + 1,
                      title: '${drama.title} — Episode ${i + 1}',
                      duration: 120 + i * 30,
                      onTap: () => context.push('/play/${drama.id * 100 + i + 1}'),
                    );
                  }),

                  // Related section
                  const SizedBox(height: 32),
                  const Text('You might also like', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 240,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: 5,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (_, i) {
                        final d = _mockDramas[(dramaId + i + 1) % _mockDramas.length];
                        return SizedBox(
                          width: 140,
                          child: GestureDetector(
                            onTap: () => context.push('/drama/${d.id}'),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(borderRadius: BorderRadius.circular(12), child: CachedNetworkImage(imageUrl: d.coverUrl, height: 180, width: 140, fit: BoxFit.cover)),
                                const SizedBox(height: 6),
                                Text(d.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _StatChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade500),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
      ],
    );
  }
}

class _EpisodeTile extends StatelessWidget {
  final int episodeNo;
  final String title;
  final int duration;
  final VoidCallback onTap;

  const _EpisodeTile({required this.episodeNo, required this.title, required this.duration, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 48, height: 32,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), color: Colors.white.withAlpha(15)),
        alignment: Alignment.center,
        child: const Icon(Icons.play_arrow, size: 20, color: Colors.white70),
      ),
      title: Text(title, style: const TextStyle(fontSize: 13)),
      subtitle: Text('${duration ~/ 60}:${(duration % 60).toString().padLeft(2, '0')} min', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
      trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }
}

// Reuse same mock data from home page
final _mockDramas = List.generate(15, (i) => Drama(
  id: i + 1,
  title: ['Love in the Rain', 'The Last Stand', 'Laugh Out Loud', 'Dark Shadows', 'Dragon Realm', 'Secret Garden', 'Iron Fist', 'Funny Business', 'Midnight Chase', "Wizard's Quest", 'Summer of Love', 'Code Red', 'Family Ties', 'Ghost Protocol', 'Starfall Chronicles'][i],
  description: 'A captivating short drama series that will keep you on the edge of your seat.',
  coverUrl: 'https://picsum.photos/seed/drama${i + 1}/400/600',
  categoryId: (i % 5) + 1,
  totalEpisodes: 5,
  tags: ['drama'],
  viewCount: 50000 - i * 3000,
  likeCount: 5000 - i * 300,
  status: 'published',
  releaseAt: '2026-0${(i % 6) + 1}-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
));
