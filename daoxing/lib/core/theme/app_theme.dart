import 'package:flutter/material.dart';

/// 仙路遥 - 纯文本修仙主题
class AppTheme {
  AppTheme._();

  // 纯黑底
  static const Color bg = Color(0xFF0A0A0A);
  // 文字色阶
  static const Color textPrimary = Color(0xFFE8E8E8);
  static const Color textSecondary = Color(0xFF999999);
  static const Color textDim = Color(0xFF666666);
  // 强调色
  static const Color accent = Color(0xFFC9A96E);
  // 境界色
  static const Color realmMortal = Color(0xFF8D6E63);
  static const Color realmFoundation = Color(0xFF64B5F6);
  static const Color realmGoldenCore = Color(0xFFFFD54F);
  static const Color realmNascentSoul = Color(0xFFCE93D8);
  static const Color realmSpiritSevering = Color(0xFFEF5350);
  static const Color realmGreatAscension = Color(0xFFE0E0E0);

  static ThemeData get darkTheme => ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        colorScheme: const ColorScheme.dark(
          primary: accent,
          secondary: textSecondary,
          surface: bg,
          error: Color(0xFFE57373),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: bg,
          foregroundColor: textPrimary,
          elevation: 0,
          centerTitle: false,
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: bg,
          selectedItemColor: accent,
          unselectedItemColor: textDim,
          type: BottomNavigationBarType.fixed,
        ),
        dividerTheme: const DividerThemeData(
          color: Color(0xFF222222),
          thickness: 1,
        ),
        cardTheme: CardThemeData(
          color: bg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.w700,
            height: 1.4,
          ),
          headlineMedium: TextStyle(
            color: accent,
            fontSize: 18,
            fontWeight: FontWeight.w600,
            height: 1.4,
          ),
          titleLarge: TextStyle(
            color: textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            height: 1.5,
          ),
          titleMedium: TextStyle(
            color: accent,
            fontSize: 14,
            fontWeight: FontWeight.w500,
            height: 1.5,
          ),
          bodyLarge: TextStyle(
            color: textPrimary,
            fontSize: 14,
            height: 1.8,
          ),
          bodyMedium: TextStyle(
            color: textSecondary,
            fontSize: 13,
            height: 1.8,
          ),
          bodySmall: TextStyle(
            color: textDim,
            fontSize: 12,
            height: 1.6,
          ),
        ),
      );
}
