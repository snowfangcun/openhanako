import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/player_provider.dart';
import '../../models/cave/cave_model.dart';

class CavePage extends ConsumerWidget {
  const CavePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final cave = player.cave;

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
                _buildHeader(context, player),
                const SizedBox(height: 20),
                ...CaveFacilityType.values.map(
                  (type) => _buildFacilityCard(context, ref, cave, type),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, PlayerState player) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.home_work, color: AppTheme.accentGold, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.cave.name, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    '灵气结晶：${player.spiritCrystals}',
                    style: const TextStyle(color: AppTheme.accentCyan),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacilityCard(
    BuildContext context,
    WidgetRef ref,
    Cave cave,
    CaveFacilityType type,
  ) {
    final facility = cave.facilities[type];
    final level = facility?.level ?? 0;
    final isBuilt = level > 0;
    final upgradeCost = CaveFacilityUpgradeCost.costForLevel(level + 1);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: _buildFacilityIcon(type),
        title: Text(type.label),
        subtitle: Text(type.description),
        trailing: isBuilt
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'Lv.$level',
                    style: const TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '升级需 $upgradeCost 结晶',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              )
            : Text(
                '建造需 $upgradeCost 结晶',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
        onTap: () {
          ref.read(playerProvider.notifier).upgradeFacility(type);
        },
      ),
    );
  }

  Widget _buildFacilityIcon(CaveFacilityType type) {
    final icons = {
      CaveFacilityType.spiritSpring: Icons.water_drop,
      CaveFacilityType.herbGarden: Icons.local_florist,
      CaveFacilityType.scriptureLibrary: Icons.menu_book,
      CaveFacilityType.beastPen: Icons.pets,
      CaveFacilityType.alchemyFurnace: Icons.local_fire_department,
      CaveFacilityType.mountainArray: Icons.shield,
    };
    return Icon(icons[type], color: AppTheme.accentCyan);
  }
}
