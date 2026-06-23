/// 运动数据模型
class HealthData {
  final int steps;
  final double distance; // 米
  final double? speed; // km/h，跑步时有值
  final DateTime timestamp;

  const HealthData({
    required this.steps,
    required this.distance,
    this.speed,
    required this.timestamp,
  });
}

/// 每日运动汇总
class DailyHealthSummary {
  final DateTime date;
  final int totalSteps;
  final double totalDistance;
  final double? maxSpeed;
  final int activeMinutes;
  final Map<int, int> hourlySteps; // 小时 -> 步数

  const DailyHealthSummary({
    required this.date,
    required this.totalSteps,
    required this.totalDistance,
    this.maxSpeed,
    required this.activeMinutes,
    required this.hourlySteps,
  });

  /// 获取指定时段的步数
  int getStepsInPeriod(int startHour, int endHour) {
    return hourlySteps.entries
        .where((e) => e.key >= startHour && e.key < endHour)
        .fold(0, (sum, e) => sum + e.value);
  }

  /// 夜间步数（23:00-5:00）
  int get nightSteps => getStepsInPeriod(23, 24) + getStepsInPeriod(0, 5);

  /// 正午步数（11:00-13:00）
  int get noonSteps => getStepsInPeriod(11, 13);

  /// 晨间步数（5:00-7:00）
  int get dawnSteps => getStepsInPeriod(5, 7);

  /// 傍晚步数（17:00-19:00）
  int get duskSteps => getStepsInPeriod(17, 19);
}
