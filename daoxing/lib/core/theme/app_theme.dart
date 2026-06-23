import 'package:flutter/material.dart';

/// 修仙主题配色
class AppTheme {
  AppTheme._();

  // 主色调 - 墨色系
  static const Color primaryDark = Color(0xFF1A1A2E);
  static const Color primaryMid = Color(0xFF16213E);
  static const Color primaryLight = Color(0xFF0F3460);

  // 强调色 - 金色/灵气色
  static const Color accentGold = Color(0xFFE2B04A);
  static const Color accentCyan = Color(0xFF00D4AA);
  static const Color accentPurple = Color(0xFF9B59B6);

  // 境界颜色
  static const Color realmMortal = Color(0xFF8D6E63);
  static const Color realmFoundation = Color(0xFF42A5F5);
  static const Color realmGoldenCore = Color(0xFFFFD700);
  static const Color realmNascentSoul = Color(0xFFAB47BC);
  static const Color realmSpiritSevering = Color(0xFFEF5350);
  static const Color realmGreatAscension = Color(0xFFE0E0E0);

  // 功能色
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);

  static ThemeData get darkTheme => ThemeData(
        brightness: Brightness.dark,
        primaryColor: accentGold,
        scaffoldBackgroundColor: primaryDark,
        colorScheme: const ColorScheme.dark(
          primary: accentGold,
          secondary: accentCyan,
          surface: primaryMid,
          error: error,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryMid,
          foregroundColor: accentGold,
          elevation: 0,
          centerTitle: true,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: primaryMid,
          selectedItemColor: accentGold,
          unselectedItemColor: Colors.grey,
          type: BottomNavigationBarType.fixed,
        ),
        cardTheme: CardThemeData(
          color: primaryMid,
          elevation: 4,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: accentGold,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
          headlineMedium: TextStyle(
            color: accentGold,
            fontSize: 22,
            fontWeight: FontWeight.w600,
          ),
          titleLarge: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
          bodyLarge: TextStyle(color: Colors.white70, fontSize: 16),
          bodyMedium: TextStyle(color: Colors.white60, fontSize: 14),
        ),
      );
}
