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
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('洞府', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text('${cave.name}　灵气结晶 ${player.spiritCrystals}', style: Theme.of(context).textTheme.bodyMedium),
              const Divider(height: 32),

              Text('── 设施 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),

              Expanded(
                child: ListView.separated(
                  itemCount: CaveFacilityType.values.length,
                  separatorBuilder: (_, __) => const Divider(height: 24),
                  itemBuilder: (context, index) {
                    final type = CaveFacilityType.values[index];
                    final facility = cave.facilities[type];
                    final level = facility?.level ?? 0;
                    final isBuilt = level > 0;
                    final cost = CaveFacilityUpgradeCost.costForLevel(level + 1);

                    return GestureDetector(
                      onTap: () => ref.read(playerProvider.notifier).upgradeFacility(type),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${type.label}${isBuilt ? "　Lv.$level" : "　未建造"}',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          Text(type.description, style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            isBuilt ? '升级需 $cost 结晶' : '建造需 $cost 结晶',
                            style: const TextStyle(color: AppTheme.textDim, fontSize: 12),
                          ),
                          if (isBuilt)
                            Text(
                              '产出倍率 ×${CaveFacilityUpgradeCost.outputMultiplier(level).toStringAsFixed(1)}',
                              style: const TextStyle(color: AppTheme.accent, fontSize: 12),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
