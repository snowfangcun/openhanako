import 'package:freezed_annotation/freezed_annotation.dart';

part 'beast_model.freezed.dart';
part 'beast_model.g.dart';

/// 灵兽类型
enum BeastType {
  cloudDeer('云鹿', '每日首次达标步数+20%修为'),
  mysticTurtle('玄龟', '连续行走加成+15%'),
  thunderBird('雷鸟', '冲刺修为+25%'),
  spiritFox('灵狐', '夜间修为+10%'),
  qilin('麒麟', '全属性+10%');

  final String label;
  final String passiveEffect;
  const BeastType(this.label, this.passiveEffect);
}

/// 灵兽模型
@freezed
class SpiritBeast with _$SpiritBeast {
  const factory SpiritBeast({
    required BeastType type,
    required int level,
    required int feedCount, // 喂养次数
    required bool isUnlocked,
  }) = _SpiritBeast;

  factory SpiritBeast.fromJson(Map<String, dynamic> json) =>
      _$SpiritBeastFromJson(json);
}

/// 灵兽解锁条件
class BeastUnlockCondition {
  final BeastType type;
  final String condition;

  const BeastUnlockCondition({required this.type, required this.condition});

  static const List<BeastUnlockCondition> conditions = [
    BeastUnlockCondition(type: BeastType.cloudDeer, condition: '洞府灵泉3级'),
    BeastUnlockCondition(type: BeastType.mysticTurtle, condition: '累计100万步'),
    BeastUnlockCondition(type: BeastType.thunderBird, condition: '炼体·雷淬触发10次'),
    BeastUnlockCondition(type: BeastType.spiritFox, condition: '夜间累计5万步'),
    BeastUnlockCondition(type: BeastType.qilin, condition: '天灵根觉醒'),
  ];
}
