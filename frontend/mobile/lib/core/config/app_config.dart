/// Application configuration.
///
/// Override with `--dart-define=API_BASE_URL=...` at build time.
class AppConfig {
  AppConfig._();

  static const String appName = 'AIshot';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080/api/v1',
  );

  /// Set to false to use real API instead of mock handlers.
  static const bool useMocks = bool.fromEnvironment(
    'USE_MOCKS',
    defaultValue: true,
  );
}
