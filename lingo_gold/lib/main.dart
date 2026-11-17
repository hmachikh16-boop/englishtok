import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'home_screen.dart';
import 'lessons_screen.dart';
import 'lesson_flow.dart';
import 'profile_screen.dart';
import 'user_profile.dart';
import 'update_service.dart';
import 'widgets.dart';
import 'theme.dart';

void main() => runApp(const LingoGoldApp());

class LingoGoldApp extends StatelessWidget {
  const LingoGoldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'تعلم',
      theme: buildAppTheme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child ?? const SizedBox.shrink(),
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _tab = 0;
  Timer? _updateTimer;

  static const int _totalLessons = 100;

  @override
  void initState() {
    super.initState();
    UserProfile.instance.load().then((_) {
      if (!mounted) return;
      setState(() {});
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) UpdateService.checkAndPrompt(context, silent: true);
      });
    });
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  Future<void> _startLesson() async {
    final up = UserProfile.instance;
    final restart = up.lessonsCompleted.value >= _totalLessons;
    final start = restart ? 1 : up.currentLessonId.value.clamp(1, _totalLessons);
    if (restart) {
      await up.saveCourseProgress(
        lessonId: 1,
        completed: 0,
        newStars: up.stars.value,
        xp: up.totalXP.value,
      );
    }
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LessonFlowScreen(
          startLessonId: start,
          totalLessons: _totalLessons,
          onLessonComplete: _onLessonComplete,
          onExit: () => setState(() => _tab = 0),
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  void _onLessonComplete(int id) {
    final up = UserProfile.instance;
    final newCompleted =
        id > up.lessonsCompleted.value ? id : up.lessonsCompleted.value;
    final newStars = up.stars.value + 5;
    final newXp = up.totalXP.value + 20;
    final next = (id + 1).clamp(1, _totalLessons);
    up.saveCourseProgress(
      lessonId: next,
      completed: newCompleted,
      newStars: newStars,
      xp: newXp,
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final up = UserProfile.instance;
    return Scaffold(
      backgroundColor: Colors.white,
      body: ValueListenableBuilder<int>(
        valueListenable: up.currentLessonId,
        builder: (context, currentLesson, _) {
          return ValueListenableBuilder<int>(
            valueListenable: up.lessonsCompleted,
            builder: (context, completed, _) {
              return ValueListenableBuilder<int>(
                valueListenable: up.stars,
                builder: (context, stars, _) {
                  return ValueListenableBuilder<int>(
                    valueListenable: up.totalXP,
                    builder: (context, xp, _) {
                      return IndexedStack(
                        index: _tab,
                        children: [
                          HomeScreen(
                            currentLessonId: currentLesson,
                            completedLessons: completed,
                            totalLessons: _totalLessons,
                            stars: stars,
                            onStart: _startLesson,
                          ),
                          LessonsScreen(
                            onStartLesson: (id) async {
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => LessonFlowScreen(
                                    startLessonId: id,
                                    totalLessons: _totalLessons,
                                    onLessonComplete: _onLessonComplete,
                                    onExit: () => setState(() => _tab = 0),
                                  ),
                                ),
                              );
                              if (mounted) setState(() {});
                            },
                          ),
                          ProfileScreen(
                            completedCount: completed,
                            streak: up.streak.value,
                            wordsLearned: completed * 6,
                            speakingScore: up.pronunciationScore.value,
                            xp: xp,
                            onContinue: () => _startLesson(),
                          ),
                        ],
                      );
                    },
                  );
                },
              );
            },
          );
        },
      ),
      bottomNavigationBar: BottomNavBar(
        index: _tab,
        onTap: (index) => setState(() => _tab = index),
      ),
    );
  }
}
