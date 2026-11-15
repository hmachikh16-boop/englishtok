import 'package:flutter/material.dart';

// Brand palette from the reference design: white canvas, green primary, blue secondary.
const Color kPrimary = Color(0xFF2E9E5B);
const Color kPrimaryDark = Color(0xFF1F7A44);
const Color kSecondary = Color(0xFF1E6FDB);
const Color kInk = Color(0xFF14213D);
const Color kMuted = Color(0xFF6B7280);
const Color kCard = Color(0xFFF5F6F8);
const Color kLine = Color(0xFFE6E8EC);
const Color kSoftGreen = Color(0xFFE9F7EF);
const Color kSoftBlue = Color(0xFFEAF2FF);
const Color kSoftOrange = Color(0xFFFFF3E3);
const Color kSoftRed = Color(0xFFFDECEC);
const Color kGold = Color(0xFFF5B301);
const Color kDanger = Color(0xFFE5484D);

const double kRadius = 16;
const double kPageMaxWidth = 640;

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: Colors.white,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kPrimary,
      primary: kPrimary,
      secondary: kSecondary,
      surface: Colors.white,
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: kInk, height: 1.1),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: kInk, height: 1.15),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: kInk),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: kInk),
      bodyLarge: TextStyle(fontSize: 16, color: kInk, height: 1.35),
      bodyMedium: TextStyle(fontSize: 14, color: kMuted, height: 1.35),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      foregroundColor: kInk,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        minimumSize: const Size(0, 52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kInk,
        minimumSize: const Size(0, 52),
        side: const BorderSide(color: kLine),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kCard,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
    ),
  );
}
