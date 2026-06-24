import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../pages/cultivation/cultivation_page.dart';
import '../pages/cave/cave_page.dart';
import '../pages/technique/technique_page.dart';
import '../pages/profile/profile_page.dart';
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
        selectedLabelStyle: const TextStyle(fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.self_improvement, size: 20),
            label: '修炼',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.home_work_outlined, size: 20),
            label: '洞府',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.auto_stories_outlined, size: 20),
            label: '功法',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline, size: 20),
            label: '道途',
          ),
        ],
      ),
    );
  }
}
