import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../pages/cultivation/cultivation_page.dart';
import '../pages/cave/cave_page.dart';
import '../pages/technique/technique_page.dart';
import '../pages/profile/profile_page.dart';
import '../core/theme/app_theme.dart';
import '../providers/player_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    CultivationPage(),
    CavePage(),
    TechniquePage(),
    ProfilePage(),
  ];

  @override
  void initState() {
    super.initState();
    // 启动时刷新数据
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(playerProvider.notifier).refreshTodayData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.self_improvement),
            activeIcon: Icon(Icons.self_improvement),
            label: '修炼',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.home_work_outlined),
            activeIcon: Icon(Icons.home_work),
            label: '洞府',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_stories_outlined),
            activeIcon: Icon(Icons.auto_stories),
            label: '功法',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: '道途',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton(
              onPressed: () {
                ref.read(playerProvider.notifier).refreshTodayData();
              },
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.primaryDark,
              child: const Icon(Icons.refresh),
            )
          : null,
    );
  }
}
