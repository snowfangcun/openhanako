import 'package:freezed_annotation/freezed_annotation.dart';

part 'secret_realm_model.freezed.dart';
part 'secret_realm_model.g.dart';

/// 秘境类型
enum SecretRealmType {
  mistForest('迷雾森林', 'weekly', '7天累计步数探索地图，步数=探索距离'),
  thunderTribulation('天劫雷域', 'monthly', '月度步数挑战，达标层数获奖励'),
  ancientPath('古道遗迹', 'event', '限时7天，步数兑换探索点'),
  sectTrial('宗门大比', 'weekly', '宗门成员周步数排行'),
  sectRaid('秘境攻坚', 'monthly', '宗门成员累计步数合力攻破Boss'),
  daoDebate('道友论道', 'pvp', '1v1步数PK，当日步数多者获胜');

  final String label;
  final String cycle;
  final String description;
  const SecretRealmType(this.label, this.cycle, this.description);
}

/// 秘境模型
@freezed
class SecretRealm with _$SecretRealm {
  const factory SecretRealm({
    required String id,
    required SecretRealmType type,
    required DateTime startTime,
    required DateTime endTime,
    required int progress, // 进度值
    required int target, // 目标值
    required List<SecretRealmReward> rewards,
  }) = _SecretRealm;

  factory SecretRealm.fromJson(Map<String, dynamic> json) =>
      _$SecretRealmFromJson(json);
}

/// 秘境奖励
@freezed
class SecretRealmReward with _$SecretRealmReward {
  const factory SecretRealmReward({
    required String name,
    required int requiredProgress,
    required bool claimed,
  }) = _SecretRealmReward;

  factory SecretRealmReward.fromJson(Map<String, dynamic> json) =>
      _$SecretRealmRewardFromJson(json);
}
