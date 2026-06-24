import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/realm/realm_model.dart';
import '../../models/technique/technique_model.dart';
import '../../models/spirit_root/spirit_root_model.dart';
import '../../models/cave/cave_model.dart';
import '../../models/beast/beast_model.dart';
import '../../models/pill/pill_model.dart';
import '../../services/health/health_data.dart';
import '../../services/health/health_provider.dart';
import '../../services/cultivation/cultivation_engine.dart';
import '../../core/constants/game_constants.dart';

/// 玩家状态
class PlayerState {
  final RealmState realm;
  final Technique activeTechnique;
  final SpiritRoot? spiritRoot;
  final Cave cave;
  final List<SpiritBeast> beasts;
  final Map<PillType, Pill> pills;
  final int streakDays;
  final int totalSteps;
  final int spiritCrystals;
  final DailyHealthSummary? todaySummary;

  const PlayerState({
    required this.realm,
    required this.activeTechnique,
    this.spiritRoot,
    required this.cave,
    required this.beasts,
    required this.pills,
    required this.streakDays,
    required this.totalSteps,
    required this.spiritCrystals,
    this.todaySummary,
  });

  PlayerState copyWith({
    RealmState? realm,
    Technique? activeTechnique,
    SpiritRoot? spiritRoot,
    Cave? cave,
    List<SpiritBeast>? beasts,
    Map<PillType, Pill>? pills,
    int? streakDays,
    int? totalSteps,
    int? spiritCrystals,
    DailyHealthSummary? todaySummary,
  }) {
    return PlayerState(
      realm: realm ?? this.realm,
      activeTechnique: activeTechnique ?? this.activeTechnique,
      spiritRoot: spiritRoot ?? this.spiritRoot,
      cave: cave ?? this.cave,
      beasts: beasts ?? this.beasts,
      pills: pills ?? this.pills,
      streakDays: streakDays ?? this.streakDays,
      totalSteps: totalSteps ?? this.totalSteps,
      spiritCrystals: spiritCrystals ?? this.spiritCrystals,
      todaySummary: todaySummary ?? this.todaySummary,
    );
  }

  /// 初始玩家状态
  static PlayerState initial() {
    return PlayerState(
      realm: RealmState(
        majorRealm: MajorRealm.mortal,
        minorStage: MinorStage.early,
        currentCultivation: 0,
        realmCultivation: RealmConfig.configs
            .firstWhere((c) => c.majorRealm == MajorRealm.mortal)
            .cultivationPerStage,
      ),
      activeTechnique: InitialTechniques.getAll().first,
      cave: Cave(
        name: '初修洞府',
        facilities: {},
        totalSpiritCrystals: 0,
      ),
      beasts: BeastType.values
          .map((t) => SpiritBeast(type: t, level: 0, feedCount: 0, isUnlocked: false))
          .toList(),
      pills: {},
      streakDays: 0,
      totalSteps: 0,
      spiritCrystals: 0,
    );
  }
}

/// 玩家状态 Notifier
class PlayerNotifier extends StateNotifier<PlayerState> {
  final Ref _ref;

  PlayerNotifier(this._ref) : super(PlayerState.initial());

  /// 刷新今日数据
  Future<void> refreshTodayData() async {
    final healthService = _ref.read(healthServiceProvider);
    final summary = await healthService.getTodaySummary();

    // 计算今日修为
    final cultivation = CultivationEngine.calculateDailyCultivation(
      steps: summary.totalSteps,
      summary: summary,
      realm: state.realm.majorRealm,
      technique: state.activeTechnique,
      streakDays: state.streakDays,
      spiritRoot: state.spiritRoot?.type,
    );

    // 计算灵气结晶
    final crystals = CultivationEngine.calculateSpiritCrystals(summary.totalSteps);

    state = state.copyWith(
      todaySummary: summary,
      totalSteps: state.totalSteps + summary.totalSteps,
      realm: state.realm.copyWith(currentCultivation: cultivation),
      spiritCrystals: state.spiritCrystals + crystals,
    );
  }

  /// 切换功法
  void switchTechnique(Technique technique) {
    state = state.copyWith(activeTechnique: technique);
  }

  /// 升级洞府设施
  void upgradeFacility(CaveFacilityType type) {
    final facilities = Map<CaveFacilityType, CaveFacility>.from(state.cave.facilities);
    final current = facilities[type];
    final currentLevel = current?.level ?? 0;

    if (currentLevel >= GameConstants.maxFacilityLevel) return;

    final cost = CaveFacilityUpgradeCost.costForLevel(currentLevel + 1);
    if (state.spiritCrystals < cost) return;

    facilities[type] = CaveFacility(
      type: type,
      level: currentLevel + 1,
      spiritCrystalsSpent: (current?.spiritCrystalsSpent ?? 0) + cost,
    );

    state = state.copyWith(
      cave: state.cave.copyWith(facilities: facilities),
      spiritCrystals: state.spiritCrystals - cost,
    );
  }

  /// 使用丹药
  bool usePill(PillType type) {
    final pills = Map<PillType, Pill>.from(state.pills);
    final pill = pills[type];
    if (pill == null || pill.count <= 0) return false;

    pills[type] = pill.copyWith(count: pill.count - 1);
    state = state.copyWith(pills: pills);
    return true;
  }
}

/// 玩家状态 Provider
final playerProvider = StateNotifierProvider<PlayerNotifier, PlayerState>((ref) {
  return PlayerNotifier(ref);
});
