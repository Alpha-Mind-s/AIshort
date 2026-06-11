import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:aishot_mobile/features/auth/providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User header
          const SizedBox(height: 16),
          CircleAvatar(radius: 40, backgroundColor: Colors.purple.withAlpha(50), child: Text(user?.nickname.characters.first.toUpperCase() ?? '?', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold))),
          const SizedBox(height: 12),
          Text(user?.nickname ?? 'Guest', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          if (user != null) Text(user.email, style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
          const SizedBox(height: 32),

          // Subscription status
          _SectionTile(
            leading: const Icon(Icons.workspace_premium_outlined, color: Colors.amber),
            title: 'My Subscription',
            subtitle: 'Free tier',
            onTap: () => context.go('/subscribe'),
          ),
          const SizedBox(height: 4),

          // Settings
          _SectionTile(
            leading: const Icon(Icons.settings_outlined),
            title: 'Account Settings',
            subtitle: 'Language, region, notifications',
            onTap: () {},
          ),
          const SizedBox(height: 4),

          _SectionTile(
            leading: const Icon(Icons.language),
            title: 'Language',
            subtitle: 'English',
            onTap: () {},
          ),
          const SizedBox(height: 4),

          // Logout
          _SectionTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: 'Log out',
            subtitle: 'Sign out of your account',
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  final Widget leading;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SectionTile({required this.leading, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: leading,
        title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        trailing: const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
