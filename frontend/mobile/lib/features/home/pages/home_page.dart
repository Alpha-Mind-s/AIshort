import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:aishot_mobile/shared/models/drama.dart';

/// HomePage — trending and latest drama grids.
///
/// In mock mode, uses hardcoded data. Replace with API call when ready.
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final List<Drama> _trending = _mockDramas;
  final List<Drama> _latest = _mockDramas.reversed.toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AIshot', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => Future.delayed(const Duration(seconds: 1)),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 80),
          children: [
            // Hero banner
            if (_trending.isNotEmpty)
              _HeroBanner(drama: _trending.first),

            const SizedBox(height: 24),

            // Trending section
            _SectionHeader(title: 'Trending Now', onTap: () {}),
            const SizedBox(height: 12),
            SizedBox(
              height: 240,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _trending.take(10).length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _DramaCard(drama: _trending[i]),
              ),
            ),

            const SizedBox(height: 32),

            // Latest section
            _SectionHeader(title: 'Latest Releases', onTap: () {}),
            const SizedBox(height: 12),
            SizedBox(
              height: 240,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _latest.take(10).length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _DramaCard(drama: _latest[i]),
              ),
            ),

            const SizedBox(height: 32),

            // Categories
            _SectionHeader(title: 'Categories', onTap: () {}),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 8, runSpacing: 8,
                children: ['Romance', 'Action', 'Comedy', 'Thriller', 'Fantasy'].map((cat) {
                  return Chip(
                    label: Text(cat, style: const TextStyle(fontSize: 13)),
                    backgroundColor: Colors.white.withAlpha(12),
                    side: BorderSide(color: Colors.white.withAlpha(25)),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onTap;
  const _SectionHeader({required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          Text('See all', style: TextStyle(fontSize: 13, color: Colors.purple.shade300)),
        ],
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final Drama drama;
  const _HeroBanner({required this.drama});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/drama/${drama.id}'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        height: 200,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          image: DecorationImage(
            image: CachedNetworkImageProvider(drama.coverUrl),
            fit: BoxFit.cover,
            colorFilter: ColorFilter.linearToSrgbGamma(),
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [Colors.black.withAlpha(204), Colors.transparent],
            ),
          ),
          alignment: Alignment.bottomLeft,
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(drama.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.play_circle, size: 16, color: Colors.purple),
                  const SizedBox(width: 4),
                  Text('Watch now', style: TextStyle(color: Colors.purple.shade200, fontSize: 13)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DramaCard extends StatelessWidget {
  final Drama drama;
  const _DramaCard({required this.drama});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/drama/${drama.id}'),
      child: SizedBox(
        width: 140,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: CachedNetworkImage(
                imageUrl: drama.coverUrl,
                height: 180, width: 140, fit: BoxFit.cover,
                placeholder: (_, __) => Container(height: 180, color: Colors.white.withAlpha(12)),
              ),
            ),
            const SizedBox(height: 6),
            Text(drama.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            Text('${drama.totalEpisodes} episodes', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }
}

// ---- mock data ----

final _mockDramas = List.generate(15, (i) => Drama(
  id: i + 1,
  title: ['Love in the Rain', 'The Last Stand', 'Laugh Out Loud', 'Dark Shadows', 'Dragon Realm', 'Secret Garden', 'Iron Fist', 'Funny Business', 'Midnight Chase', "Wizard's Quest", 'Summer of Love', 'Code Red', 'Family Ties', 'Ghost Protocol', 'Starfall Chronicles'][i],
  description: 'A captivating short drama series.',
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
