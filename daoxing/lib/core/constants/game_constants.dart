/// 游戏常量
class GameConstants {
  GameConstants._();

  // 步数相关
  static const int dailyStepGoal = 8000; // 每日步数目标
  static const int stepOverflowThreshold = 12000; // 灵气溢出阈值（目标50%）
  static const int dailyStepCap = 30000; // 单日步数上限（超过后修为递减）
  static const int dailyStepHardCap = 50000; // 单日步数硬上限（不再获得修为）

  // 修为计算
  static const double baseStepToCultivation = 1.0; // 每步基础修为
  static const double speedRunThreshold = 8.0; // 炼体·疾行配速阈值 km/h
  static const double sprintThreshold = 12.0; // 炼体·御风配速阈值 km/h

  // 连续加成
  static const Map<int, double> streakBonuses = {
    3: 1.1,
    7: 1.3,
    14: 1.5,
    30: 2.0,
    100: 3.0,
  };

  // 时辰加成
  static const Map<String, double> timeSlotBonuses = {
    'mao': 1.5, // 卯时 5:00-7:00
    'wu': 1.2, // 午时 11:00-13:00
    'you': 1.3, // 酉时 17:00-19:00
    'zi': 1.8, // 子时 23:00-1:00
  };

  // 子时最低步数要求
  static const int ziTimeMinSteps = 2000;

  // 洞府
  static const int maxFacilityLevel = 10;

  // 灵兽
  static const int beastFeedCost = 1000; // 喂养一次消耗步数
}
