import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserProfile {
  UserProfile._();
  static final UserProfile instance = UserProfile._();

  static const _kName = 'profile_name';
  static const _kAvatar = 'profile_avatar';
  static const _kLevel = 'profile_level';

  final ValueNotifier<String> name = ValueNotifier<String>('');
  final ValueNotifier<String> avatar = ValueNotifier<String>('👦');
  final ValueNotifier<String> level = ValueNotifier<String>('مبتدئ');

  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    _loaded = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      name.value = prefs.getString(_kName) ?? '';
      avatar.value = prefs.getString(_kAvatar) ?? '👦';
      level.value = prefs.getString(_kLevel) ?? 'مبتدئ';
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

  bool get hasName => name.value.trim().isNotEmpty;

  String get displayName => hasName ? name.value.trim() : '...';
}
