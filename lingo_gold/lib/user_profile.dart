import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserProfile {
  UserProfile._();
  static final UserProfile instance = UserProfile._();

  static const _kName = 'profile_name';
  static const _kAvatar = 'profile_avatar';
  static const _kLevel = 'profile_level';
  static const _kXP = 'profile_xp';
  static const _kLessons = 'profile_lessons';
  static const _kStreak = 'profile_streak';
  static const _kLastStudy = 'profile_last_study';
  static const _kPronunciation = 'profile_pronunciation';
  static const _kCurrentLesson = 'course_current_lesson';
  static const _kStars = 'course_stars';

  final ValueNotifier<String> name = ValueNotifier<String>('');
  final ValueNotifier<String> avatar = ValueNotifier<String>('👦');
  final ValueNotifier<String> level = ValueNotifier<String>('مبتدئ');
  final ValueNotifier<int> totalXP = ValueNotifier<int>(0);
  final ValueNotifier<int> lessonsCompleted = ValueNotifier<int>(0);
  final ValueNotifier<int> streak = ValueNotifier<int>(0);
  final ValueNotifier<String> lastStudyDate = ValueNotifier<String>('');
  final ValueNotifier<int> pronunciationScore = ValueNotifier<int>(88);
  final ValueNotifier<int> currentLessonId = ValueNotifier<int>(1);
  final ValueNotifier<int> stars = ValueNotifier<int>(0);

  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      name.value = prefs.getString(_kName) ?? '';
      avatar.value = prefs.getString(_kAvatar) ?? '👦';
      level.value = prefs.getString(_kLevel) ?? 'مبتدئ';
      totalXP.value = prefs.getInt(_kXP) ?? 0;
      lessonsCompleted.value = prefs.getInt(_kLessons) ?? 0;
      streak.value = prefs.getInt(_kStreak) ?? 0;
      lastStudyDate.value = prefs.getString(_kLastStudy) ?? '';
      pronunciationScore.value = prefs.getInt(_kPronunciation) ?? 88;
      currentLessonId.value = prefs.getInt(_kCurrentLesson) ?? 1;
      stars.value = prefs.getInt(_kStars) ?? 0;
    } catch (_) {}
  }

  Future<void> save({String? newName, String? newAvatar, String? newLevel}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (newName != null) {
        await prefs.setString(_kName, newName);
        name.value = newName;
      }
      if (newAvatar != null) {
        await prefs.setString(_kAvatar, newAvatar);
        avatar.value = newAvatar;
      }
      if (newLevel != null) {
        await prefs.setString(_kLevel, newLevel);
        level.value = newLevel;
      }
    } catch (_) {}
  }

  static const _kCompleted = 'progress_completed';
  static const _kCurrent = 'progress_current';

  Future<void> loadProgress({
    required void Function(Set<int> completed, int current) onLoaded,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_kCompleted);
      final completed = list == null
          ? <int>{}
          : list.map(int.tryParse).whereType<int>().toSet();
      final current = prefs.getInt(_kCurrent) ?? 0;
      onLoaded(completed, current);
    } catch (_) {
      onLoaded(<int>{}, 0);
    }
  }

  Future<void> saveProgress(Set<int> completed, int current) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(
        _kCompleted,
        completed.map((e) => e.toString()).toList(),
      );
      await prefs.setInt(_kCurrent, current);
    } catch (_) {}
  }

  Future<void> saveStats({
    int? xp,
    int? lessons,
    int? streakVal,
    String? lastStudy,
    int? pronunciation,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (xp != null) {
        await prefs.setInt(_kXP, xp);
        totalXP.value = xp;
      }
      if (lessons != null) {
        await prefs.setInt(_kLessons, lessons);
        lessonsCompleted.value = lessons;
      }
      if (streakVal != null) {
        await prefs.setInt(_kStreak, streakVal);
        streak.value = streakVal;
      }
      if (lastStudy != null) {
        await prefs.setString(_kLastStudy, lastStudy);
        lastStudyDate.value = lastStudy;
      }
      if (pronunciation != null) {
        await prefs.setInt(_kPronunciation, pronunciation);
        pronunciationScore.value = pronunciation;
      }
    } catch (_) {}
  }

  Future<void> saveCourseProgress({
    required int lessonId,
    required int completed,
    required int newStars,
    required int xp,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_kCurrentLesson, lessonId);
      await prefs.setInt(_kStars, newStars);
      await prefs.setInt(_kLessons, completed);
      await prefs.setInt(_kXP, xp);
      currentLessonId.value = lessonId;
      stars.value = newStars;
      lessonsCompleted.value = completed;
      totalXP.value = xp;
    } catch (_) {}
  }

  bool get hasName => name.value.trim().isNotEmpty;

  String get displayName => hasName ? name.value.trim() : 'متعلم';
}
