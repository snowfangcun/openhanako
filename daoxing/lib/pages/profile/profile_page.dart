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
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryDark, AppTheme.primaryMid],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildProfileHeader(context, player),
                const SizedBox(height: 20),
                _buildStatsGrid(context, player),
                const SizedBox(height: 16),
                _buildSpiritRootCard(context, player),
                const SizedBox(height: 16),
                _buildBeastList(context, player),
                const SizedBox(height: 16),
                _buildPillInventory(context, player),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, PlayerState player) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    _getRealmColor(player.realm.majorRealm).withAlpha(150),
                    _getRealmColor(player.realm.majorRealm),
                  ],
                ),
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 12),
            Text(
              '${player.realm.majorRealm.label} · ${player.realm.minorStage.label}',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 4),
            Text(
              '累计步数：${_formatNumber(player.totalSteps)}',
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, PlayerState player) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard('修为', '${player.realm.currentCultivation}', Icons.self_improvement),
        _buildStatCard('灵气结晶', '${player.spiritCrystals}', Icons.diamond),
        _buildStatCard('连续修炼', '${player.streakDays}天', Icons.local_fire_department),
        _buildStatCard('洞府设施', '${player.cave.facilities.length}', Icons.home_work),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppTheme.accentGold, size: 24),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildSpiritRootCard(BuildContext context, PlayerState player) {
    final spiritRoot = player.spiritRoot;
    return Card(
      child: ListTile(
        leading: Icon(
          Icons.blur_on,
          color: spiritRoot != null ? Color(spiritRoot.type.colorValue) : Colors.grey,
        ),
        title: Text(spiritRoot?.type.label ?? '灵根未觉醒'),
        subtitle: Text(spiritRoot?.type.description ?? '持续运动将觉醒灵根'),
      ),
    );
  }

  Widget _buildBeastList(BuildContext context, PlayerState player) {
    final unlockedBeasts = player.beasts.where((b) => b.isUnlocked).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('灵兽', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (unlockedBeasts.isEmpty)
              const Text('尚未收服灵兽', style: TextStyle(color: Colors.grey))
            else
              ...unlockedBeasts.map((beast) => ListTile(
                    leading: const Icon(Icons.pets, color: AppTheme.accentCyan),
                    title: Text(beast.type.label),
                    subtitle: Text(beast.type.passiveEffect),
                    trailing: Text('Lv.${beast.level}',
                        style: const TextStyle(color: AppTheme.accentGold)),
                  )),
          ],
        ),
      ),
    );
  }

  Widget _buildPillInventory(BuildContext context, PlayerState player) {
    final ownedPills = player.pills.values.where((p) => p.count > 0).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('丹药', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (ownedPills.isEmpty)
              const Text('丹药栏空空如也', style: TextStyle(color: Colors.grey))
            else
              ...ownedPills.map((pill) => ListTile(
                    leading: const Icon(Icons.medication, color: AppTheme.accentPurple),
                    title: Text(pill.type.label),
                    subtitle: Text(pill.type.effect),
                    trailing: Text('×${pill.count}',
                        style: const TextStyle(color: AppTheme.accentGold)),
                  )),
          ],
        ),
      ),
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

  String _formatNumber(int n) {
    if (n >= 100000000) return '${(n / 100000000).toStringAsFixed(1)}亿';
    if (n >= 10000) return '${(n / 10000).toStringAsFixed(1)}万';
    return n.toString();
  }
}
