import 'package:freezed_annotation/freezed_annotation.dart';

part 'realm_model.freezed.dart';
part 'realm_model.g.dart';

/// 大境界
enum MajorRealm {
  mortal('凡人境', '凡躯'),
  foundation('筑基境', '筑基'),
  goldenCore('金丹境', '结丹'),
  nascentSoul('元婴境', '化形'),
  spiritSevering('化神境', '炼神'),
  greatAscension('大乘境', '大乘');

  final String label;
  final String firstTitle;
  const MajorRealm(this.label, this.firstTitle);
}

/// 小境界阶段
enum MinorStage {
  early('初阶', 1.0),
  mid('中阶', 1.3),
  late('高阶', 1.6),
  peak('圆满', 2.0);

  final String label;
  final double multiplier;
  const MinorStage(this.label, this.multiplier);
}

/// 境界模型
@freezed
class RealmState with _$RealmState {
  const factory RealmState({
    required MajorRealm majorRealm,
    required MinorStage minorStage,
    required int currentCultivation, // 当前修为值
    required int realmCultivation, // 当前小境界所需修为
  }) = _RealmState;

  factory RealmState.fromJson(Map<String, dynamic> json) =>
      _$RealmStateFromJson(json);
}

/// 境界配置表
class RealmConfig {
  final MajorRealm majorRealm;
  final int totalCultivation; // 该大境界总修为
  final double coefficient; // 修为获取系数（越高越慢）

  const RealmConfig({
    required this.majorRealm,
    required this.totalCultivation,
    required this.coefficient,
  });

  static const List<RealmConfig> configs = [
    RealmConfig(majorRealm: MajorRealm.mortal, totalCultivation: 100000, coefficient: 1.0),
    RealmConfig(majorRealm: MajorRealm.foundation, totalCultivation: 500000, coefficient: 0.8),
    RealmConfig(majorRealm: MajorRealm.goldenCore, totalCultivation: 2000000, coefficient: 0.6),
    RealmConfig(majorRealm: MajorRealm.nascentSoul, totalCultivation: 8000000, coefficient: 0.4),
    RealmConfig(majorRealm: MajorRealm.spiritSevering, totalCultivation: 30000000, coefficient: 0.3),
    RealmConfig(majorRealm: MajorRealm.greatAscension, totalCultivation: 100000000, coefficient: 0.2),
  ];

  /// 获取每个小境界所需修为
  int get cultivationPerStage => totalCultivation ~/ 4;
}
