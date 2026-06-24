/// 丹药类型
enum PillType {
  gatherQi('聚气丹', '下次运动修为×2，持续1次'),
  foundation('筑基丹', '突破试炼成功率+30%'),
  swiftStep('疾行丹', '1小时内步数修为×3'),
  marrowWash('洗髓丹', '重置灵根（下次计算时生效）'),
  realmBreak('破境丹', '跳过一次突破试炼');

  final String label;
  final String effect;
  const PillType(this.label, this.effect);
}

/// 丹药模型
class Pill {
  final PillType type;
  final int count; // 持有数量

  const Pill({
    required this.type,
    required this.count,
  });

  Pill copyWith({
    PillType? type,
    int? count,
  }) {
    return Pill(
      type: type ?? this.type,
      count: count ?? this.count,
    );
  }

  factory Pill.fromJson(Map<String, dynamic> json) {
    return Pill(
      type: PillType.values.firstWhere(
        (e) => e.name == json['type'],
      ),
      count: json['count'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'count': count,
    };
  }
}

/// 丹药炼制配方
class PillRecipe {
  final PillType result;
  final Map<String, int> materials; // 材料名 -> 数量
  final int successRate; // 炼制成功率百分比

  const PillRecipe({
    required this.result,
    required this.materials,
    required this.successRate,
  });

  static const List<PillRecipe> recipes = [
    PillRecipe(result: PillType.gatherQi, materials: {'灵草': 3}, successRate: 90),
    PillRecipe(result: PillType.foundation, materials: {'灵草': 10, '灵液': 5}, successRate: 70),
    PillRecipe(result: PillType.swiftStep, materials: {'风草': 5}, successRate: 80),
    PillRecipe(result: PillType.marrowWash, materials: {'内丹': 1, '灵草': 20}, successRate: 50),
    PillRecipe(result: PillType.realmBreak, materials: {'灵草': 50, '灵液': 20}, successRate: 30),
  ];
}
