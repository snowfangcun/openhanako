import 'dart:math';
import '../health/health_data.dart';

/// 健康数据服务抽象接口
abstract class HealthService {
  /// 检查健康数据是否可用
  Future<bool> isAvailable();

  /// 请求权限
  Future<bool> requestPermissions();

  /// 获取今日步数
  Future<int> getTodaySteps();

  /// 获取今日运动汇总
  Future<DailyHealthSummary> getTodaySummary();

  /// 获取指定日期范围的运动汇总
  Future<List<DailyHealthSummary>> getSummaryRange(
    DateTime start,
    DateTime end,
  );

  /// 监听实时步数变化
  Stream<int> get stepCountStream;

  /// 获取当前配速（km/h），步行/跑步时有效
  Future<double?> getCurrentSpeed();
}

/// Mock 健康数据服务（开发环境使用）
class MockHealthService implements HealthService {
  final Random _random = Random();
  int _mockSteps = 0;
  bool _initialized = false;

  @override
  Future<bool> isAvailable() async => true;

  @override
  Future<bool> requestPermissions() async => true;

  @override
  Future<int> getTodaySteps() async {
    _ensureInitialized();
    // 每次调用随机增加步数，模拟走路
    _mockSteps += _random.nextInt(100) + 20;
    return _mockSteps;
  }

  @override
  Future<DailyHealthSummary> getTodaySummary() async {
    _ensureInitialized();
    final now = DateTime.now();
    final hourlySteps = <int, int>{};

    // 模拟各时段步数分布
    for (int hour = 0; hour <= now.hour; hour++) {
      if (hour < 6) {
        hourlySteps[hour] = _random.nextInt(50);
      } else if (hour < 9) {
        hourlySteps[hour] = _random.nextInt(800) + 200; // 早高峰
      } else if (hour < 12) {
        hourlySteps[hour] = _random.nextInt(300) + 100;
      } else if (hour < 14) {
        hourlySteps[hour] = _random.nextInt(600) + 200; // 午间
      } else if (hour < 18) {
        hourlySteps[hour] = _random.nextInt(200) + 50;
      } else if (hour < 21) {
        hourlySteps[hour] = _random.nextInt(800) + 300; // 晚间
      } else {
        hourlySteps[hour] = _random.nextInt(100);
      }
    }

    final totalSteps = hourlySteps.values.fold(0, (a, b) => a + b);
    _mockSteps = totalSteps;

    return DailyHealthSummary(
      date: now,
      totalSteps: totalSteps,
      totalDistance: totalSteps * 0.7,
      maxSpeed: _random.nextDouble() * 6 + 3, // 3-9 km/h
      activeMinutes: _random.nextInt(60) + 30,
      hourlySteps: hourlySteps,
    );
  }

  @override
  Future<List<DailyHealthSummary>> getSummaryRange(
    DateTime start,
    DateTime end,
  ) async {
    final summaries = <DailyHealthSummary>[];
    for (var date = start;
        date.isBefore(end) || date.isAtSameMomentAs(end);
        date = date.add(const Duration(days: 1))) {
      final steps = _random.nextInt(12000) + 2000;
      summaries.add(DailyHealthSummary(
        date: date,
        totalSteps: steps,
        totalDistance: steps * 0.7,
        maxSpeed: _random.nextDouble() * 8 + 2,
        activeMinutes: _random.nextInt(90) + 20,
        hourlySteps: {},
      ));
    }
    return summaries;
  }

  @override
  Stream<int> get stepCountStream async* {
    int steps = _mockSteps;
    while (true) {
      await Future.delayed(const Duration(seconds: 3));
      steps += _random.nextInt(20) + 1;
      _mockSteps = steps;
      yield steps;
    }
  }

  @override
  Future<double?> getCurrentSpeed() async {
    // 模拟：80%概率在走路，20%概率静止
    if (_random.nextDouble() < 0.2) return null;
    return _random.nextDouble() * 6 + 3;
  }

  void _ensureInitialized() {
    if (!_initialized) {
      _mockSteps = _random.nextInt(5000) + 1000;
      _initialized = true;
    }
  }
}
