import 'package:freezed_annotation/freezed_annotation.dart';

part 'spirit_root_model.freezed.dart';
part 'spirit_root_model.g.dart';

/// 灵根类型
enum SpiritRootType {
  metal('金灵根', '高配速运动占比>40%，炼体加成高', 0xFFFFD700),
  wood('木灵根', '连续长距离步行占比>40%，耐力加成高', 0xFF4CAF50),
  water('水灵根', '夜间运动占比>30%，阴属功法加成', 0xFF2196F3),
  fire('火灵根', '正午运动占比>30%，阳属功法加成', 0xFFF44336),
  earth('土灵根', '每日步数最稳定，均衡加成', 0xFF8D6E63),
  heavenly('天灵根', '五行灵根碎片各10个，全属性+30%', 0xFFE0E0E0);

  final String label;
  final String description;
  final int colorValue;
  const SpiritRootType(this.label, this.description, this.colorValue);
}

/// 灵根模型
@freezed
class SpiritRoot with _$SpiritRoot {
  const factory SpiritRoot({
    required SpiritRootType type,
    required Map<SpiritRootType, int> fragments, // 各灵根碎片数量
    required DateTime lastCalculated, // 上次计算时间
  }) = _SpiritRoot;

  factory SpiritRoot.fromJson(Map<String, dynamic> json) =>
      _$SpiritRootFromJson(json);
}

/// 灵根碎片来源
class SpiritRootFragmentSource {
  final SpiritRootType type;
  final String trigger;
  final String description;

  const SpiritRootFragmentSource({
    required this.type,
    required this.trigger,
    required this.description,
  });

  static const List<SpiritRootFragmentSource> sources = [
    SpiritRootFragmentSource(
      type: SpiritRootType.metal,
      trigger: '炼体·疾行',
      description: '配速 > 8km/h 时概率获得',
    ),
    SpiritRootFragmentSource(
      type: SpiritRootType.wood,
      trigger: '长距修行',
      description: '单次连续步行 > 5000步时概率获得',
    ),
    SpiritRootFragmentSource(
      type: SpiritRootType.water,
      trigger: '夜行修炼',
      description: '夜间（23:00-5:00）运动时概率获得',
    ),
    SpiritRootFragmentSource(
      type: SpiritRootType.fire,
      trigger: '午时修炼',
      description: '正午（11:00-13:00）运动时概率获得',
    ),
    SpiritRootFragmentSource(
      type: SpiritRootType.earth,
      trigger: '稳修不辍',
      description: '连续7天步数方差最小时概率获得',
    ),
  ];
}
