import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:aishot_mobile/core/config/app_config.dart';

/// Centralized HTTP client with JWT injection and auto-refresh.
class ApiClient {
  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;

  ApiClient._() {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    // Attach JWT
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // Auto-refresh on 401
        if (error.response?.statusCode == 401 && !error.requestOptions.path.contains('/auth/refresh')) {
          final newToken = await _refreshToken();
          if (newToken != null) {
            // Retry with new token
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $newToken';
            try {
              final response = await dio.fetch(opts);
              handler.resolve(response);
              return;
            } catch (_) {}
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<String?> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return null;

      final response = await Dio(BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        headers: {'Content-Type': 'application/json'},
      )).post('/auth/refresh', data: {'refresh_token': refreshToken});

      if (response.data['code'] == 0) {
        final data = response.data['data'];
        final newAccess = data['access_token'] as String;
        final newRefresh = data['refresh_token'] as String;
        await _storage.write(key: 'access_token', value: newAccess);
        await _storage.write(key: 'refresh_token', value: newRefresh);
        return newAccess;
      }
    } catch (_) {}
    return null;
  }

  /// Generic GET
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic json)? fromJson,
  }) async {
    final res = await dio.get(path, queryParameters: queryParameters);
    return ApiResponse.fromDio(res, fromJson: fromJson);
  }

  /// Generic POST
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    T Function(dynamic json)? fromJson,
  }) async {
    final res = await dio.post(path, data: data);
    return ApiResponse.fromDio(res, fromJson: fromJson);
  }

  /// Generic DELETE
  Future<void> delete(String path) async {
    await dio.delete(path);
  }
}

/// Wraps the standard API response envelope.
class ApiResponse<T> {
  final int code;
  final String message;
  final T? data;
  final PaginationMeta? meta;

  const ApiResponse({
    required this.code,
    required this.message,
    this.data,
    this.meta,
  });

  factory ApiResponse.fromDio(
    Response<dynamic> res, {
    T Function(dynamic json)? fromJson,
  }) {
    final json = res.data as Map<String, dynamic>;
    return ApiResponse(
      code: json['code'] as int,
      message: json['message'] as String? ?? '',
      data: json['data'] != null && fromJson != null
          ? fromJson(json['data'])
          : json['data'] as T?,
      meta: json['meta'] != null
          ? PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PaginationMeta {
  final int page;
  final int pageSize;
  final int total;

  const PaginationMeta({
    required this.page,
    required this.pageSize,
    required this.total,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) => PaginationMeta(
    page: json['page'] as int? ?? 1,
    pageSize: json['page_size'] as int? ?? 20,
    total: json['total'] as int? ?? 0,
  );
}
