# AIshot Mobile — Flutter App

> 海外 AI 短剧平台 iOS / Android 移动端

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.22+ |
| State | Riverpod |
| HTTP | Dio |
| Routing | GoRouter |
| Video | video_player + chewie |
| Storage | flutter_secure_storage + shared_preferences |
| Payments | flutter_stripe |

## Project Structure

```
lib/
├── main.dart                          # App entry point
├── core/
│   ├── config/
│   │   ├── app_config.dart            # Environment config
│   │   └── app_router.dart            # GoRouter route definitions
│   ├── network/
│   │   └── api_client.dart            # Dio-based HTTP client + JWT
│   ├── storage/                       # Local storage abstractions
│   └── theme/
│       └── app_theme.dart             # Material 3 dark theme
├── features/
│   ├── auth/       # Login, Register, OAuth
│   ├── home/       # Home page with trending/latest
│   ├── drama/      # Drama detail + episodes
│   ├── player/     # Video player
│   ├── favorites/  # Favorites list
│   ├── comments/   # Comments UI
│   ├── subscribe/  # Subscription plans
│   └── profile/    # User profile + settings
└── shared/
    ├── models/     # Shared data models (Drama, Episode, etc.)
    ├── widgets/    # Reusable widgets
    └── utils/      # Helpers, formatters
```

## Getting Started

```bash
# Install Flutter 3.22+
# https://docs.flutter.dev/get-started/install

# Get dependencies
flutter pub get

# Run code generation (JSON serialization, Riverpod)
dart run build_runner build

# Run on device/simulator
flutter run

# Build APK
flutter build apk --release

# Build iOS
flutter build ios --release
```

## Configuration

Set API base URL at build time:

```bash
flutter run --dart-define=API_BASE_URL=https://api.example.com/api/v1
flutter run --dart-define=USE_MOCKS=false
```

## MVP Feature Checklist

- [x] Project scaffold
- [x] Login / Register pages
- [x] OAuth login (Google / Apple / Facebook buttons)
- [x] Home page with trending + latest
- [x] Drama detail + episode list
- [x] Video player page (placeholder)
- [x] Favorites grid
- [x] Subscription plan cards
- [x] Profile + logout
- [ ] Video player integration (video_player + chewie)
- [ ] Comments UI
- [ ] Offline caching
- [ ] Push notifications
- [ ] Real API integration
