/// 功法属性倾向
enum TechniqueAffinity {
  balanced('均衡', '太极步'),
  speed('速度', '疾风诀'),
  endurance('耐力', '龟息功'),
  yin('阴属', '夜行术'),
  yang('阳属', '烈阳功'),
  fiveElements('五行', '五行归元诀'),
  thunder('雷属', '雷音步'),
  ice('冰属', '踏雪无痕'),
  longevity('长生', '长生诀');

  final String label;
  final String example;
  const TechniqueAffinity(this.label, this.example);
}

/// 功法稀有度
enum TechniqueRarity {
  common('凡品', 1.0, 0xFF9E9E9E),
  rare('灵品', 1.5, 0xFF42A5F5),
  epic('仙品', 2.0, 0xFFAB47BC),
  legendary('神品', 3.0, 0xFFFF9800);

  final String label;
  final double multiplier;
  final int colorValue;
  const TechniqueRarity(this.label, this.multiplier, this.colorValue);
}

/// 功法模型
class Technique {
  final String id;
  final String name;
  final String description;
  final TechniqueAffinity affinity;
  final TechniqueRarity rarity;
  final double cultivationBonus; // 修为加成倍率
  final List<String> unlockConditions; // 解锁条件描述
  final bool isActive; // 是否为当前修炼功法

  const Technique({
    required this.id,
    required this.name,
    required this.description,
    required this.affinity,
    required this.rarity,
    required this.cultivationBonus,
    required this.unlockConditions,
    required this.isActive,
  });

  Technique copyWith({
    String? id,
    String? name,
    String? description,
    TechniqueAffinity? affinity,
    TechniqueRarity? rarity,
    double? cultivationBonus,
    List<String>? unlockConditions,
    bool? isActive,
  }) {
    return Technique(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      affinity: affinity ?? this.affinity,
      rarity: rarity ?? this.rarity,
      cultivationBonus: cultivationBonus ?? this.cultivationBonus,
      unlockConditions: unlockConditions ?? this.unlockConditions,
      isActive: isActive ?? this.isActive,
    );
  }

  factory Technique.fromJson(Map<String, dynamic> json) {
    return Technique(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      affinity: TechniqueAffinity.values.firstWhere(
        (e) => e.name == json['affinity'],
      ),
      rarity: TechniqueRarity.values.firstWhere(
        (e) => e.name == json['rarity'],
      ),
      cultivationBonus: (json['cultivationBonus'] as num).toDouble(),
      unlockConditions: (json['unlockConditions'] as List).cast<String>(),
      isActive: json['isActive'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'affinity': affinity.name,
      'rarity': rarity.name,
      'cultivationBonus': cultivationBonus,
      'unlockConditions': unlockConditions,
      'isActive': isActive,
    };
  }
}

/// 初始功法列表
class InitialTechniques {
  static List<Technique> getAll() => [
        Technique(
          id: 'taiji_step',
          name: '太极步',
          description: '阴阳相济，步履从容。均衡提升修为获取效率。',
          affinity: TechniqueAffinity.balanced,
          rarity: TechniqueRarity.common,
          cultivationBonus: 1.1,
          unlockConditions: ['初始赠送'],
          isActive: true,
        ),
        Technique(
          id: 'swift_wind',
          name: '疾风诀',
          description: '风行天下，疾如闪电。配速越快，修为越高。',
          affinity: TechniqueAffinity.speed,
          rarity: TechniqueRarity.rare,
          cultivationBonus: 1.3,
          unlockConditions: ['筑基境解锁'],
          isActive: false,
        ),
        Technique(
          id: 'turtle_breath',
          name: '龟息功',
          description: '静水流深，绵绵不绝。连续行走步数加成显著。',
          affinity: TechniqueAffinity.endurance,
          rarity: TechniqueRarity.rare,
          cultivationBonus: 1.2,
          unlockConditions: ['累计10万步解锁'],
          isActive: false,
        ),
        Technique(
          id: 'night_walk',
          name: '夜行术',
          description: '月华如水，暗蕴灵机。夜间修为获取翻倍。',
          affinity: TechniqueAffinity.yin,
          rarity: TechniqueRarity.epic,
          cultivationBonus: 2.0,
          unlockConditions: ['子时累计1万步解锁'],
          isActive: false,
        ),
      ];
}
