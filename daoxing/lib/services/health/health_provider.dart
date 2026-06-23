import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'health_data.dart';
import 'health_service.dart';

/// 健康数据服务 Provider
final healthServiceProvider = Provider<HealthService>((ref) {
  // 开发环境或桌面端使用 Mock
  if (kDebugMode || !(Platform.isAndroid || Platform.isIOS)) {
    return MockHealthService();
  }
  // 生产环境使用真实服务
  return RealHealthService();
});

/// 真实健康数据服务实现
class RealHealthService implements HealthService {
  // TODO: 接入 health 和 pedometer 插件
  @override
  Future<bool> isAvailable() async {
    // 将使用 health 插件检查
    return false;
  }

  @override
  Future<bool> requestPermissions() async {
    // 将使用 permission_handler + health 插件
    return false;
  }

  @override
  Future<int> getTodaySteps() async {
    // 将使用 health 插件查询
    return 0;
  }

  @override
  Future<DailyHealthSummary> getTodaySummary() async {
    // 将使用 health 插件查询
    final now = DateTime.now();
    return DailyHealthSummary(
      date: now,
      totalSteps: 0,
      totalDistance: 0,
      activeMinutes: 0,
      hourlySteps: {},
    );
  }

  @override
  Future<List<DailyHealthSummary>> getSummaryRange(
    DateTime start,
    DateTime end,
  ) async {
    return [];
  }

  @override
  Stream<int> get stepCountStream => const Stream.empty();

  @override
  Future<double?> getCurrentSpeed() async => null;
}
