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

  bool get hasName => name.value.trim().isNotEmpty;

  String get displayName => hasName ? name.value.trim() : '...';
}
