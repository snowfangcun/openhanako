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
                Text('功法典籍', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(
                  '当前修炼：${player.activeTechnique.name}',
                  style: const TextStyle(color: AppTheme.accentGold),
                ),
                const SizedBox(height: 16),
                ...techniques.map((t) => _buildTechniqueCard(context, ref, t, player)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTechniqueCard(
    BuildContext context,
    WidgetRef ref,
    Technique technique,
    PlayerState player,
  ) {
    final isActive = technique.id == player.activeTechnique.id;
    final rarityColor = Color(technique.rarity.colorValue);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: isActive
          ? RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: rarityColor, width: 2),
            )
          : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: rarityColor.withAlpha(30),
                  ),
                  child: Icon(Icons.auto_stories, color: rarityColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            technique.name,
                            style: TextStyle(
                              color: rarityColor,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: rarityColor.withAlpha(30),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              technique.rarity.label,
                              style: TextStyle(color: rarityColor, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        technique.affinity.label,
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                if (isActive)
                  const Icon(Icons.check_circle, color: AppTheme.success)
                else
                  TextButton(
                    onPressed: () {
                      ref.read(playerProvider.notifier).switchTechnique(technique);
                    },
                    child: const Text('修炼'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(technique.description, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  '修为加成：×${technique.cultivationBonus}',
                  style: const TextStyle(color: AppTheme.accentGold, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '解锁：${technique.unlockConditions.join("、")}',
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
