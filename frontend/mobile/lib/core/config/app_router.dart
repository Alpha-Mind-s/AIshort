import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:aishot_mobile/features/auth/pages/login_page.dart';
import 'package:aishot_mobile/features/auth/pages/register_page.dart';
import 'package:aishot_mobile/features/home/pages/home_page.dart';
import 'package:aishot_mobile/features/drama/pages/drama_detail_page.dart';
import 'package:aishot_mobile/features/player/pages/player_page.dart';
import 'package:aishot_mobile/features/favorites/pages/favorites_page.dart';
import 'package:aishot_mobile/features/profile/pages/profile_page.dart';
import 'package:aishot_mobile/features/subscribe/pages/subscribe_page.dart';
import 'package:aishot_mobile/features/auth/providers/auth_provider.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  redirect: (context, state) {
    // Simple auth guard — skip if not logged in
    final isAuth = ref.read(isAuthenticatedProvider);
    final isAuthRoute = state.matchedLocation == '/login' ||
        state.matchedLocation == '/register';
    final isPublicRoute = state.matchedLocation == '/';

    if (!isAuth && !isAuthRoute && !isPublicRoute) {
      return '/login';
    }
    return null;
  },
  routes: [
    // ---- Auth routes (no shell) ----
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),

    // ---- Main shell (bottom nav) ----
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const HomePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/favorites',
              builder: (context, state) => const FavoritesPage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/subscribe',
              builder: (context, state) => const SubscribePage(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfilePage(),
            ),
          ],
        ),
      ],
    ),

    // ---- Detail routes ----
    GoRoute(
      path: '/drama/:id',
      builder: (context, state) =>
          DramaDetailPage(dramaId: int.parse(state.pathParameters['id']!)),
    ),
    GoRoute(
      path: '/play/:episodeId',
      builder: (context, state) =>
          PlayerPage(episodeId: int.parse(state.pathParameters['episodeId']!)),
    ),
  ],
);

/// A global Riverpod ref for use in [GoRouter.redirect].
/// The [ProviderScope] must wrap [MaterialApp.router].
final ref = ProviderScope.containerOf(
  // This is a workaround — we store a ref in a static-like pattern
  // In production, use a Riverpod-aware redirect guard instead.
  _rootNavigatorKey.currentContext!,
);

/// Bottom navigation shell
class MainShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShell({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.bookmark_outline), label: 'Favorites'),
          BottomNavigationBarItem(icon: Icon(Icons.workspace_premium_outlined), label: 'Subscribe'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}
