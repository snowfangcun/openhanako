import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/theme/app_theme.dart';
import '../../core/constants/game_constants.dart';
import '../../providers/player_provider.dart';
import '../../models/realm/realm_model.dart';
import '../../models/technique/technique_model.dart';
import '../../services/cultivation/cultivation_engine.dart';

class CultivationPage extends ConsumerWidget {
  const CultivationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final summary = player.todaySummary;
    final steps = summary?.totalSteps ?? 0;
    final timeSlot = CultivationEngine.getCurrentTimeSlot();

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
                _buildStepProgress(context, steps),
                const SizedBox(height: 20),
                _buildRealmCard(context, player),
                const SizedBox(height: 16),
                _buildTimeSlotBonus(context, timeSlot),
                const SizedBox(height: 16),
                _buildCultivationDetail(context, player, steps),
                const SizedBox(height: 16),
                _buildActiveTechnique(context, player),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, PlayerState player) {
    final realmName = player.realm.majorRealm.label;
    final stageName = player.realm.minorStage.label;
    final title = _getRealmTitle(player.realm);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // 境界图标
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: _getRealmGradient(player.realm.majorRealm),
                boxShadow: [
                  BoxShadow(
                    color: _getRealmColor(player.realm.majorRealm).withAlpha(76),
                    blurRadius: 12,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: const Icon(
                Icons.self_improvement,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: _getRealmColor(player.realm.majorRealm),
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$realmName · $stageName',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
            ),
            // 连续天数
            Column(
              children: [
                Text(
                  '${player.streakDays}',
                  style: const TextStyle(
                    color: AppTheme.accentGold,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text('连续天', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepProgress(BuildContext context, int steps) {
    final percent = (steps / GameConstants.dailyStepGoal).clamp(0.0, 1.0);
    final isComplete = steps >= GameConstants.dailyStepGoal;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '今日修行',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            CircularPercentIndicator(
              radius: 80,
              lineWidth: 12,
              percent: percent,
              center: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '$steps',
                    style: const TextStyle(
                      color: AppTheme.accentGold,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text('步', style: TextStyle(color: Colors.grey)),
                ],
              ),
              progressColor: isComplete ? AppTheme.success : AppTheme.accentGold,
              backgroundColor: Colors.white12,
              circularStrokeCap: CircularStrokeCap.round,
            )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .shimmer(duration: 2.seconds, color: AppTheme.accentGold.withAlpha(30)),
            const SizedBox(height: 12),
            Text(
              isComplete
                  ? '吐纳圆满！灵气充盈'
                  : '距吐纳圆满还需 ${GameConstants.dailyStepGoal - steps} 步',
              style: TextStyle(
                color: isComplete ? AppTheme.success : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRealmCard(BuildContext context, PlayerState player) {
    final realm = player.realm;
    final progress = (realm.currentCultivation / realm.realmCultivation).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('修为进度', style: Theme.of(context).textTheme.titleLarge),
                if (CultivationEngine.canAttemptBreakthrough(realm))
                  ElevatedButton(
                    onPressed: () {
                      // TODO: 触发突破试炼
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentGold,
                      foregroundColor: AppTheme.primaryDark,
                    ),
                    child: const Text('突破'),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            LinearPercentIndicator(
              percent: progress,
              lineHeight: 16,
              barRadius: const Radius.circular(8),
              progressColor: _getRealmColor(realm.majorRealm),
              backgroundColor: Colors.white12,
              center: Text(
                '${(progress * 100).toStringAsFixed(1)}%',
                style: const TextStyle(fontSize: 10, color: Colors.white),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${realm.currentCultivation} / ${realm.realmCultivation}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeSlotBonus(BuildContext context, TimeSlot timeSlot) {
    final bonus = CultivationEngine.getTimeSlotBonus(timeSlot, 0);
    final slotName = _getTimeSlotName(timeSlot);

    return Card(
      child: ListTile(
        leading: Icon(
          _getTimeSlotIcon(timeSlot),
          color: bonus > 1.0 ? AppTheme.accentGold : Colors.grey,
        ),
        title: Text('当前时辰：$slotName'),
        trailing: bonus > 1.0
            ? Text(
                '修为 ×${bonus.toStringAsFixed(1)}',
                style: const TextStyle(
                  color: AppTheme.accentGold,
                  fontWeight: FontWeight.bold,
                ),
              )
            : const Text('修为 ×1.0', style: TextStyle(color: Colors.grey)),
      ),
    );
  }

  Widget _buildCultivationDetail(BuildContext context, PlayerState player, int steps) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('修为详情', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            _buildDetailRow('境界系数', '×${CultivationEngine.getRealmCoefficient(player.realm.majorRealm).toStringAsFixed(1)}'),
            _buildDetailRow('功法加成', '×${player.activeTechnique.cultivationBonus.toStringAsFixed(1)}'),
            _buildDetailRow('连续加成', '×${CultivationEngine.getStreakBonus(player.streakDays).toStringAsFixed(1)}'),
            _buildDetailRow('灵气结晶', '${player.spiritCrystals}'),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveTechnique(BuildContext context, PlayerState player) {
    final tech = player.activeTechnique;
    return Card(
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            color: _getRarityColor(tech.rarity).withAlpha(30),
          ),
          child: Icon(Icons.auto_stories, color: _getRarityColor(tech.rarity)),
        ),
        title: Text(tech.name),
        subtitle: Text(tech.description, maxLines: 2, overflow: TextOverflow.ellipsis),
        trailing: Text(
          '修为 ×${tech.cultivationBonus}',
          style: const TextStyle(color: AppTheme.accentGold),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(color: Colors.white)),
        ],
      ),
    );
  }

  String _getRealmTitle(RealmState realm) {
    final stageIndex = MinorStage.values.indexOf(realm.minorStage);
    final titles = ['凡躯', '通脉', '开窍', '蜕凡'];
    return titles[stageIndex.clamp(0, 3)];
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

  LinearGradient _getRealmGradient(MajorRealm realm) {
    final color = _getRealmColor(realm);
    return LinearGradient(
      colors: [color.withAlpha(150), color],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }

  Color _getRarityColor(TechniqueRarity rarity) {
    return Color(rarity.colorValue);
  }

  String _getTimeSlotName(TimeSlot slot) {
    switch (slot) {
      case TimeSlot.mao: return '卯时（晨曦初露）';
      case TimeSlot.wu: return '午时（阳气鼎盛）';
      case TimeSlot.you: return '酉时（金气当令）';
      case TimeSlot.zi: return '子时（阴气最盛）';
      case TimeSlot.normal: return '灵气平淡';
    }
  }

  IconData _getTimeSlotIcon(TimeSlot slot) {
    switch (slot) {
      case TimeSlot.mao: return Icons.wb_twilight;
      case TimeSlot.wu: return Icons.wb_sunny;
      case TimeSlot.you: return Icons.wb_cloudy;
      case TimeSlot.zi: return Icons.nights_stay;
      case TimeSlot.normal: return Icons.circle_outlined;
    }
  }
}
