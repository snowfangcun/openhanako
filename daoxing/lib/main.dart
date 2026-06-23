import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/theme/app_theme.dart';
import 'pages/home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 初始化本地存储
  await Hive.initFlutter();

  runApp(const ProviderScope(child: DaoXingApp()));
}

class DaoXingApp extends StatelessWidget {
  const DaoXingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '道行',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const HomePage(),
    );
  }
}
