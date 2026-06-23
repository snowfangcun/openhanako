import 'package:freezed_annotation/freezed_annotation.dart';

part 'technique_model.freezed.dart';
part 'technique_model.g.dart';

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
@freezed
class Technique with _$Technique {
  const factory Technique({
    required String id,
    required String name,
    required String description,
    required TechniqueAffinity affinity,
    required TechniqueRarity rarity,
    required double cultivationBonus, // 修为加成倍率
    required List<String> unlockConditions, // 解锁条件描述
    required bool isActive, // 是否为当前修炼功法
  }) = _Technique;

  factory Technique.fromJson(Map<String, dynamic> json) =>
      _$TechniqueFromJson(json);
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
