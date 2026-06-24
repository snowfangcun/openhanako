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

/// 秘境奖励
class SecretRealmReward {
  final String name;
  final int requiredProgress;
  final bool claimed;

  const SecretRealmReward({
    required this.name,
    required this.requiredProgress,
    required this.claimed,
  });

  SecretRealmReward copyWith({
    String? name,
    int? requiredProgress,
    bool? claimed,
  }) {
    return SecretRealmReward(
      name: name ?? this.name,
      requiredProgress: requiredProgress ?? this.requiredProgress,
      claimed: claimed ?? this.claimed,
    );
  }

  factory SecretRealmReward.fromJson(Map<String, dynamic> json) {
    return SecretRealmReward(
      name: json['name'] as String,
      requiredProgress: json['requiredProgress'] as int,
      claimed: json['claimed'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'requiredProgress': requiredProgress,
      'claimed': claimed,
    };
  }
}

/// 秘境模型
class SecretRealm {
  final String id;
  final SecretRealmType type;
  final DateTime startTime;
  final DateTime endTime;
  final int progress; // 进度值
  final int target; // 目标值
  final List<SecretRealmReward> rewards;

  const SecretRealm({
    required this.id,
    required this.type,
    required this.startTime,
    required this.endTime,
    required this.progress,
    required this.target,
    required this.rewards,
  });

  SecretRealm copyWith({
    String? id,
    SecretRealmType? type,
    DateTime? startTime,
    DateTime? endTime,
    int? progress,
    int? target,
    List<SecretRealmReward>? rewards,
  }) {
    return SecretRealm(
      id: id ?? this.id,
      type: type ?? this.type,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      progress: progress ?? this.progress,
      target: target ?? this.target,
      rewards: rewards ?? this.rewards,
    );
  }

  factory SecretRealm.fromJson(Map<String, dynamic> json) {
    return SecretRealm(
      id: json['id'] as String,
      type: SecretRealmType.values.firstWhere(
        (e) => e.name == json['type'],
      ),
      startTime: DateTime.parse(json['startTime'] as String),
      endTime: DateTime.parse(json['endTime'] as String),
      progress: json['progress'] as int,
      target: json['target'] as int,
      rewards: (json['rewards'] as List)
          .map((e) => SecretRealmReward.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'startTime': startTime.toIso8601String(),
      'endTime': endTime.toIso8601String(),
      'progress': progress,
      'target': target,
      'rewards': rewards.map((e) => e.toJson()).toList(),
    };
  }
}
