import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/player_provider.dart';
import '../../models/realm/realm_model.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('道途', style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                Text(
                  '${player.realm.majorRealm.label} · ${player.realm.minorStage.label}　累计 ${_fmt(player.totalSteps)} 步',
                  style: TextStyle(color: _getRealmColor(player.realm.majorRealm), fontSize: 14),
                ),
                const Divider(height: 32),

                // 属性
                Text('── 修为 ──', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('修为　${player.realm.currentCultivation}'),
                Text('灵气结晶　${player.spiritCrystals}'),
                Text('连续修炼　${player.streakDays} 天'),
                Text('洞府设施　${player.cave.facilities.length} 座'),
                const Divider(height: 32),

                // 灵根
                Text('── 灵根 ──', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (player.spiritRoot != null) ...[
                  Text(player.spiritRoot!.type.label, style: const TextStyle(color: AppTheme.accent)),
                  Text(player.spiritRoot!.type.description, style: Theme.of(context).textTheme.bodySmall),
                ] else
                  Text('灵根未觉醒，持续运动将觉醒灵根', style: Theme.of(context).textTheme.bodySmall),
                const Divider(height: 32),

                // 灵兽
                Text('── 灵兽 ──', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                _buildBeastList(context, player),
                const Divider(height: 32),

                // 丹药
                Text('── 丹药 ──', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                _buildPillList(context, player),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBeastList(BuildContext context, PlayerState player) {
    final unlocked = player.beasts.where((b) => b.isUnlocked).toList();
    if (unlocked.isEmpty) {
      return Text('尚未收服灵兽', style: Theme.of(context).textTheme.bodySmall);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: unlocked.map((b) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text('${b.type.label}　Lv.${b.level}　${b.type.passiveEffect}'),
      )).toList(),
    );
  }

  Widget _buildPillList(BuildContext context, PlayerState player) {
    final owned = player.pills.values.where((p) => p.count > 0).toList();
    if (owned.isEmpty) {
      return Text('丹药栏空空如也', style: Theme.of(context).textTheme.bodySmall);
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: owned.map((p) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text('${p.type.label} ×${p.count}　${p.type.effect}'),
      )).toList(),
    );
  }

  Color _getRealmColor(MajorRealm realm) {
    switch (realm) {
      case MajorRealm.mortal: return AppTheme.realmMortal;
      case MajorRealm.foundation: return AppTheme.realmFoundation;
      case MajorRealm.goldenCore: return AppTheme.realmGoldenCore;
      case MajorRealm.nascentSoul: return AppTheme.realmNascentSoul;
      case MajorRealm.spiritSevering: return AppTheme.realmSpiritSevering;
      case MajorRealm.greatAscension: return AppTheme.realmGreatAscension;
    }
  }

  String _fmt(int n) {
    if (n >= 100000000) return '${(n / 100000000).toStringAsFixed(1)}亿';
    if (n >= 10000) return '${(n / 10000).toStringAsFixed(1)}万';
    return n.toString();
  }
}
