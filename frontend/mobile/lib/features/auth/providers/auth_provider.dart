import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:aishot_mobile/core/network/api_client.dart';

/// User model
class AuthUser {
  final int id;
  final String email;
  final String nickname;
  final String? avatarUrl;
  final String role;
  final String language;
  final String region;
  final String createdAt;

  const AuthUser({
    required this.id,
    required this.email,
    required this.nickname,
    this.avatarUrl,
    required this.role,
    required this.language,
    required this.region,
    required this.createdAt,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
    id: json['id'] as int,
    email: json['email'] as String,
    nickname: json['nickname'] as String,
    avatarUrl: json['avatar_url'] as String?,
    role: json['role'] as String,
    language: json['language'] as String,
    region: json['region'] as String,
    createdAt: json['created_at'] as String,
  );
}

/// Auth state
class AuthState {
  final AuthUser? user;
  final bool isLoading;

  const AuthState({this.user, this.isLoading = false});

  AuthState copyWith({AuthUser? user, bool? isLoading}) =>
      AuthState(user: user ?? this.user, isLoading: isLoading ?? this.isLoading);
}

/// Auth notifier — manages login/register/logout.
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api = ApiClient();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthNotifier() : super(const AuthState()) {
    _loadStoredUser();
  }

  Future<void> _loadStoredUser() async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      // In a real app, call /auth/me to validate token and get user
      // For now, just mark as having a token
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await _api.post('/auth/login',
        data: {'email': email, 'password': password},
      );
      final data = res.data as Map<String, dynamic>;
      final tokens = data;
      await _storage.write(key: 'access_token', value: tokens['access_token']);
      await _storage.write(key: 'refresh_token', value: tokens['refresh_token']);
      final user = AuthUser.fromJson(tokens['user']);
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = AuthState(isLoading: false);
      rethrow;
    }
  }

  Future<void> register(String email, String password, String nickname) async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await _api.post('/auth/register',
        data: {'email': email, 'password': password, 'nickname': nickname},
      );
      final data = res.data as Map<String, dynamic>;
      await _storage.write(key: 'access_token', value: data['access_token']);
      await _storage.write(key: 'refresh_token', value: data['refresh_token']);
      final user = AuthUser.fromJson(data['user']);
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = AuthState(isLoading: false);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (_) {}
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
    state = const AuthState();
  }
}

// ---- Providers ----

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final currentUserProvider = Provider<AuthUser?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).user != null;
});

// Global ref holder for router guard.
final authNotifierHolder = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
