import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/constants/game_constants.dart';
import '../../providers/player_provider.dart';
import '../../models/realm/realm_model.dart';
import '../../services/cultivation/cultivation_engine.dart';

class CultivationPage extends ConsumerWidget {
  const CultivationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final summary = player.todaySummary;
    final steps = summary?.totalSteps ?? 0;
    final timeSlot = CultivationEngine.getCurrentTimeSlot();
    final realm = player.realm;
    final progress = (realm.currentCultivation / realm.realmCultivation).clamp(0.0, 1.0);
    final isComplete = steps >= GameConstants.dailyStepGoal;
    final canBreak = CultivationEngine.canAttemptBreakthrough(realm);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 标题
              Text('仙路遥', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(
                '${realm.majorRealm.label} · ${realm.minorStage.label}',
                style: TextStyle(
                  color: _getRealmColor(realm.majorRealm),
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Divider(height: 32),

              // 今日修行
              Text('── 今日修行 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('步数　$steps / ${GameConstants.dailyStepGoal}'),
              _buildTextProgressBar(context, progress),
              Text(
                isComplete ? '吐纳圆满，灵气充盈' : '距圆满尚需 ${GameConstants.dailyStepGoal - steps} 步',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              if (steps > GameConstants.stepOverflowThreshold)
                Text(
                  '灵气溢出！已凝练灵气结晶 ${CultivationEngine.calculateSpiritCrystals(steps)} 枚',
                  style: const TextStyle(color: AppTheme.accent, fontSize: 13),
                ),
              const Divider(height: 32),

              // 修为进度
              Text('── 修为 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('当前　${realm.currentCultivation}'),
              Text('突破　${realm.realmCultivation}'),
              _buildTextProgressBar(context, progress),
              if (canBreak)
                Text(
                  '修为已满，可尝试突破！',
                  style: const TextStyle(color: AppTheme.accent, fontSize: 13),
                ),
              const Divider(height: 32),

              // 时辰
              Text('── 时辰 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _buildTimeSlotInfo(context, timeSlot, steps),
              const Divider(height: 32),

              // 加成明细
              Text('── 加成 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _buildBonusDetail(context, player, steps),
              const Divider(height: 32),

              // 当前功法
              Text('── 功法 ──', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('${player.activeTechnique.name}　${player.activeTechnique.affinity.label}　修为 ×${player.activeTechnique.cultivationBonus}'),
              Text(player.activeTechnique.description, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextProgressBar(BuildContext context, double progress) {
    const width = 30;
    final filled = (progress * width).round();
    final bar = '█' * filled + '░' * (width - filled);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text(bar, style: TextStyle(
        color: progress >= 1.0 ? AppTheme.accent : AppTheme.textDim,
        fontSize: 11,
        fontFamily: 'monospace',
      )),
    );
  }

  Widget _buildTimeSlotInfo(BuildContext context, TimeSlot timeSlot, int steps) {
    final bonus = CultivationEngine.getTimeSlotBonus(timeSlot, steps);
    final names = {
      TimeSlot.mao: '卯时·晨曦初露',
      TimeSlot.wu: '午时·阳气鼎盛',
      TimeSlot.you: '酉时·金气当令',
      TimeSlot.zi: '子时·阴气最盛',
      TimeSlot.normal: '灵气平淡',
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('当前　${names[timeSlot]}'),
        Text(
          bonus > 1.0 ? '加成　修为 ×${bonus.toStringAsFixed(1)}' : '加成　无',
          style: TextStyle(
            color: bonus > 1.0 ? AppTheme.accent : AppTheme.textDim,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildBonusDetail(BuildContext context, PlayerState player, int steps) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('境界系数　×${CultivationEngine.getRealmCoefficient(player.realm.majorRealm).toStringAsFixed(1)}'),
        Text('功法加成　×${player.activeTechnique.cultivationBonus.toStringAsFixed(1)}'),
        Text('连续加成　×${CultivationEngine.getStreakBonus(player.streakDays).toStringAsFixed(1)}　（${player.streakDays}天）'),
        Text('灵气结晶　${player.spiritCrystals}'),
      ],
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
}
