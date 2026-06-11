import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:aishot_mobile/shared/models/drama.dart';

/// Favorites page — lists favorited dramas.
class FavoritesPage extends StatelessWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock data
    final favorites = _mockDramas.take(6).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('My Favorites', style: TextStyle(fontWeight: FontWeight.bold))),
      body: favorites.isEmpty
          ? const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bookmark_border, size: 56, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('No favorites yet', style: TextStyle(color: Colors.grey, fontSize: 15)),
                  SizedBox(height: 4),
                  Text('Start exploring!', style: TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.7,
                crossAxisSpacing: 12,
                mainAxisSpacing: 16,
              ),
              itemCount: favorites.length,
              itemBuilder: (_, i) {
                final drama = favorites[i];
                return GestureDetector(
                  onTap: () => context.push('/drama/${drama.id}'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: CachedNetworkImage(
                          imageUrl: drama.coverUrl,
                          height: 200, width: double.infinity, fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(drama.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                      Text('${drama.totalEpisodes} episodes', style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

final _mockDramas = List.generate(15, (i) => Drama(
  id: i + 1,
  title: ['Love in the Rain', 'The Last Stand', 'Laugh Out Loud', 'Dark Shadows', 'Dragon Realm', 'Secret Garden', 'Iron Fist', 'Funny Business', 'Midnight Chase', "Wizard's Quest", 'Summer of Love', 'Code Red', 'Family Ties', 'Ghost Protocol', 'Starfall Chronicles'][i],
  description: 'A captivating short drama series.',
  coverUrl: 'https://picsum.photos/seed/drama${i + 1}/400/600',
  categoryId: 1, totalEpisodes: 5, tags: [], viewCount: 1000, likeCount: 100,
  status: 'published', releaseAt: '', createdAt: '',
));
