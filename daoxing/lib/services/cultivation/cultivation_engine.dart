import '../health/health_data.dart';
import '../../core/constants/game_constants.dart';
import '../../models/realm/realm_model.dart';
import '../../models/technique/technique_model.dart';
import '../../models/spirit_root/spirit_root_model.dart';

/// 时辰判定
enum TimeSlot {
  mao,  // 卯时 5:00-7:00
  wu,   // 午时 11:00-13:00
  you,  // 酉时 17:00-19:00
  zi,   // 子时 23:00-1:00
  normal, // 其余时段
}

/// 修为计算引擎
class CultivationEngine {
  /// 判定当前时辰
  static TimeSlot getCurrentTimeSlot([DateTime? now]) {
    now ??= DateTime.now();
    final hour = now.hour;

    if (hour >= 5 && hour < 7) return TimeSlot.mao;
    if (hour >= 11 && hour < 13) return TimeSlot.wu;
    if (hour >= 17 && hour < 19) return TimeSlot.you;
    if (hour >= 23 || hour < 1) return TimeSlot.zi;
    return TimeSlot.normal;
  }

  /// 获取时辰加成
  static double getTimeSlotBonus(TimeSlot slot, int currentSteps) {
    switch (slot) {
      case TimeSlot.mao:
        return GameConstants.timeSlotBonuses['mao']!;
      case TimeSlot.wu:
        return GameConstants.timeSlotBonuses['wu']!;
      case TimeSlot.you:
        return GameConstants.timeSlotBonuses['you']!;
      case TimeSlot.zi:
        // 子时需要最低步数门槛
        if (currentSteps >= GameConstants.ziTimeMinSteps) {
          return GameConstants.timeSlotBonuses['zi']!;
        }
        return 1.0;
      case TimeSlot.normal:
        return 1.0;
    }
  }

  /// 获取连续打卡加成
  static double getStreakBonus(int consecutiveDays) {
    double bonus = 1.0;
    for (final entry in GameConstants.streakBonuses.entries) {
      if (consecutiveDays >= entry.key) {
        bonus = entry.value;
      }
    }
    return bonus;
  }

  /// 获取境界系数
  static double getRealmCoefficient(MajorRealm realm) {
    return RealmConfig.configs
        .firstWhere((c) => c.majorRealm == realm)
        .coefficient;
  }

  /// 计算单日修为
  ///
  /// [steps] - 当日步数
  /// [summary] - 当日运动汇总
  /// [realm] - 当前境界
  /// [technique] - 当前功法
  /// [streakDays] - 连续打卡天数
  /// [spiritRoot] - 当前灵根
  static int calculateDailyCultivation({
    required int steps,
    required DailyHealthSummary summary,
    required MajorRealm realm,
    required Technique technique,
    required int streakDays,
    SpiritRootType? spiritRoot,
  }) {
    // 1. 基础修为 = 步数 × 基础系数
    double cultivation = steps * GameConstants.baseStepToCultivation;

    // 2. 境界系数（越高越慢）
    cultivation *= getRealmCoefficient(realm);

    // 3. 功法加成
    cultivation *= technique.cultivationBonus;

    // 4. 时辰加成（取当日最高时段）
    final timeSlot = getCurrentTimeSlot();
    cultivation *= getTimeSlotBonus(timeSlot, steps);

    // 5. 连续打卡加成
    cultivation *= getStreakBonus(streakDays);

    // 6. 灵根加成
    if (spiritRoot != null) {
      cultivation *= _getSpiritRootBonus(spiritRoot, summary);
    }

    // 7. 炼体加成（跑步速度）
    if (summary.maxSpeed != null) {
      if (summary.maxSpeed! > GameConstants.sprintThreshold) {
        cultivation *= 1.5; // 炼体·御风
      } else if (summary.maxSpeed! > GameConstants.speedRunThreshold) {
        cultivation *= 1.2; // 炼体·疾行
      }
    }

    // 8. 步数上限衰减
    if (steps > GameConstants.dailyStepCap) {
      final overSteps = steps - GameConstants.dailyStepCap;
      final decayFactor = 1.0 - (overSteps / GameConstants.dailyStepHardCap);
      cultivation *= decayFactor.clamp(0.0, 1.0);
    }

    // 9. 达标奖励
    if (steps >= GameConstants.dailyStepGoal) {
      cultivation *= 1.2; // 吐纳圆满 +20%
    }

    return cultivation.toInt();
  }

  /// 灵根加成计算
  static double _getSpiritRootBonus(
    SpiritRootType type,
    DailyHealthSummary summary,
  ) {
    switch (type) {
      case SpiritRootType.metal:
        // 金灵根：高配速占比高时加成
        return summary.maxSpeed != null && summary.maxSpeed! > 8 ? 1.3 : 1.0;
      case SpiritRootType.wood:
        // 木灵根：长距离步行加成
        return summary.totalSteps > 10000 ? 1.25 : 1.0;
      case SpiritRootType.water:
        // 水灵根：夜间运动加成
        return summary.nightSteps > 3000 ? 1.3 : 1.0;
      case SpiritRootType.fire:
        // 火灵根：正午运动加成
        return summary.noonSteps > 2000 ? 1.3 : 1.0;
      case SpiritRootType.earth:
        // 土灵根：均衡加成
        return 1.15;
      case SpiritRootType.heavenly:
        // 天灵根：全属性+30%
        return 1.3;
    }
  }

  /// 计算灵气结晶产出（步数超过目标50%时）
  static int calculateSpiritCrystals(int steps) {
    if (steps <= GameConstants.stepOverflowThreshold) return 0;
    final overflow = steps - GameConstants.stepOverflowThreshold;
    return overflow ~/ 1000; // 每1000步溢出 = 1灵气结晶
  }

  /// 判断是否触发突破试炼
  static bool canAttemptBreakthrough(RealmState realm) {
    return realm.currentCultivation >= realm.realmCultivation;
  }
}
