import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Full-screen video player page.
class PlayerPage extends StatelessWidget {
  final int episodeId;

  const PlayerPage({super.key, required this.episodeId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        actions: [
          IconButton(icon: const Icon(Icons.closed_caption_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.hd_outlined), onPressed: () {}),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Video placeholder — replace with video_player + chewie
            Container(
              height: 220,
              color: Colors.white.withAlpha(8),
              child: const Center(child: Icon(Icons.play_circle_outline, size: 64, color: Colors.white38)),
            ),
            const SizedBox(height: 24),
            const Text('Episode playing...', style: TextStyle(color: Colors.white54)),
            const SizedBox(height: 8),

            // Controls placeholder
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(icon: const Icon(Icons.skip_previous, size: 32), onPressed: () {}),
                Container(
                  decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.purple.withAlpha(50)),
                  child: IconButton(icon: const Icon(Icons.pause, size: 36, color: Colors.purple), onPressed: () {}),
                ),
                IconButton(icon: const Icon(Icons.skip_next, size: 32), onPressed: () {}),
              ],
            ),

            // Episode info
            const SizedBox(height: 16),
            const Text('Ep. 1: The Beginning', style: TextStyle(color: Colors.white70, fontSize: 13)),
            const Text('02:30 / 05:00', style: TextStyle(color: Colors.grey, fontSize: 11)),

            // Volume placeholder
            const SizedBox(height: 8),
            SizedBox(
              width: 250,
              child: LinearProgressIndicator(value: 0.5, backgroundColor: Colors.white.withAlpha(20), color: Colors.purple),
            ),
          ],
        ),
      ),
    );
  }
}
