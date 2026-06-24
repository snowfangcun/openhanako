import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'health_data.dart';
import 'health_service.dart';

/// 健康数据服务 Provider
final healthServiceProvider = Provider<HealthService>((ref) {
  // Web 平台或调试模式使用 Mock
  if (kIsWeb || kDebugMode) {
    return MockHealthService();
  }
  // 移动端生产环境使用真实服务
  return RealHealthService();
});

/// 真实健康数据服务实现
class RealHealthService implements HealthService {
  // TODO: 接入 health 和 pedometer 插件
  @override
  Future<bool> isAvailable() async {
    return false;
  }

  @override
  Future<bool> requestPermissions() async {
    return false;
  }

  @override
  Future<int> getTodaySteps() async {
    return 0;
  }

  @override
  Future<DailyHealthSummary> getTodaySummary() async {
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
