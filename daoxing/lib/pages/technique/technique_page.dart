import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/player_provider.dart';
import '../../models/technique/technique_model.dart';

class TechniquePage extends ConsumerWidget {
  const TechniquePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final techniques = InitialTechniques.getAll();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('功法', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text('当前修炼：${player.activeTechnique.name}', style: const TextStyle(color: AppTheme.accent, fontSize: 13)),
              const Divider(height: 32),

              Expanded(
                child: ListView.separated(
                  itemCount: techniques.length,
                  separatorBuilder: (_, __) => const Divider(height: 24),
                  itemBuilder: (context, index) {
                    final t = techniques[index];
                    final isActive = t.id == player.activeTechnique.id;

                    return GestureDetector(
                      onTap: isActive ? null : () => ref.read(playerProvider.notifier).switchTechnique(t),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                t.name,
                                style: TextStyle(
                                  color: isActive ? AppTheme.accent : AppTheme.textPrimary,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text('　${t.rarity.label}　${t.affinity.label}', style: Theme.of(context).textTheme.bodySmall),
                              const Spacer(),
                              if (isActive)
                                const Text('修炼中', style: TextStyle(color: AppTheme.accent, fontSize: 12))
                              else
                                const Text('切换', style: TextStyle(color: AppTheme.textDim, fontSize: 12)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(t.description, style: Theme.of(context).textTheme.bodySmall),
                          Text('修为 ×${t.cultivationBonus}　解锁：${t.unlockConditions.join("、")}', style: const TextStyle(color: AppTheme.textDim, fontSize: 12)),
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
