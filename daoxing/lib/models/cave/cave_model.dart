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
class CaveFacility {
  final CaveFacilityType type;
  final int level; // 1-10级
  final int spiritCrystalsSpent; // 已投入灵气结晶

  const CaveFacility({
    required this.type,
    required this.level,
    required this.spiritCrystalsSpent,
  });

  CaveFacility copyWith({
    CaveFacilityType? type,
    int? level,
    int? spiritCrystalsSpent,
  }) {
    return CaveFacility(
      type: type ?? this.type,
      level: level ?? this.level,
      spiritCrystalsSpent: spiritCrystalsSpent ?? this.spiritCrystalsSpent,
    );
  }

  factory CaveFacility.fromJson(Map<String, dynamic> json) {
    return CaveFacility(
      type: CaveFacilityType.values.firstWhere(
        (e) => e.name == json['type'],
      ),
      level: json['level'] as int,
      spiritCrystalsSpent: json['spiritCrystalsSpent'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'level': level,
      'spiritCrystalsSpent': spiritCrystalsSpent,
    };
  }
}

/// 洞府模型
class Cave {
  final String name;
  final Map<CaveFacilityType, CaveFacility> facilities;
  final int totalSpiritCrystals; // 累计灵气结晶

  const Cave({
    required this.name,
    required this.facilities,
    required this.totalSpiritCrystals,
  });

  Cave copyWith({
    String? name,
    Map<CaveFacilityType, CaveFacility>? facilities,
    int? totalSpiritCrystals,
  }) {
    return Cave(
      name: name ?? this.name,
      facilities: facilities ?? this.facilities,
      totalSpiritCrystals: totalSpiritCrystals ?? this.totalSpiritCrystals,
    );
  }

  factory Cave.fromJson(Map<String, dynamic> json) {
    final facilitiesRaw = json['facilities'] as Map<String, dynamic>;
    final facilities = <CaveFacilityType, CaveFacility>{};
    facilitiesRaw.forEach((key, value) {
      final type = CaveFacilityType.values.firstWhere((e) => e.name == key);
      facilities[type] = CaveFacility.fromJson(value as Map<String, dynamic>);
    });
    return Cave(
      name: json['name'] as String,
      facilities: facilities,
      totalSpiritCrystals: json['totalSpiritCrystals'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'facilities': facilities.map((key, value) => MapEntry(key.name, value.toJson())),
      'totalSpiritCrystals': totalSpiritCrystals,
    };
  }
}

/// 设施升级消耗表
class CaveFacilityUpgradeCost {
  static int costForLevel(int level) => 10 * level * level;

  /// 设施产出倍率
  static double outputMultiplier(int level) => 1.0 + (level - 1) * 0.2;
}
