import 'package:freezed_annotation/freezed_annotation.dart';

part 'cave_model.freezed.dart';
part 'cave_model.g.dart';

/// 洞府设施类型
enum CaveFacilityType {
  spiritSpring('灵泉', '每小时自动产出少量修为'),
  herbGarden('药园', '每日产出丹药材料'),
  scriptureLibrary('藏经阁', '随机解锁功法碎片'),
  beastPen('灵兽栏', '养成灵兽伙伴'),
  alchemyFurnace('炼丹炉', '炼制丹药'),
  mountainArray('护山大阵', '抵御秘境侵蚀');

  final String label;
  final String description;
  const CaveFacilityType(this.label, this.description);
}

/// 洞府设施模型
@freezed
class CaveFacility with _$CaveFacility {
  const factory CaveFacility({
    required CaveFacilityType type,
    required int level, // 1-10级
    required int spiritCrystalsSpent, // 已投入灵气结晶
  }) = _CaveFacility;

  factory CaveFacility.fromJson(Map<String, dynamic> json) =>
      _$CaveFacilityFromJson(json);
}

/// 洞府模型
@freezed
class Cave with _$Cave {
  const factory Cave({
    required String name,
    required Map<CaveFacilityType, CaveFacility> facilities,
    required int totalSpiritCrystals, // 累计灵气结晶
  }) = _Cave;

  factory Cave.fromJson(Map<String, dynamic> json) =>
      _$CaveFromJson(json);
}

/// 设施升级消耗表
class CaveFacilityUpgradeCost {
  static int costForLevel(int level) => 10 * level * level;

  /// 设施产出倍率
  static double outputMultiplier(int level) => 1.0 + (level - 1) * 0.2;
}
