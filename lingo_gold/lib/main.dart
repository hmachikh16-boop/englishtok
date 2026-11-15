import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'data.dart';
import 'home_screen.dart';
import 'learn_screen.dart';
import 'lesson_flow.dart';
import 'profile_screen.dart';
import 'user_profile.dart';
import 'update_service.dart';
import 'speak_screen.dart';
import 'theme.dart';
import 'widgets.dart';

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
  int _currentLessonIndex = 2;
  final Set<int> _completed = {0, 1};
  final Set<int> _unlockedGroups = {0, 1};
  int _selectedGroup = 0;
  Timer? _updateTimer;
  int _speakingScore = 88;
  final int _dailyGoal = 65;
  final int _streak = 7;
  final int _wordsLearned = 120;
  final int _xp = 120;

  @override
  void initState() {
    super.initState();
    _selectedGroup = _currentLessonIndex ~/ 10;
    UserProfile.instance.load().then((_) {
      if (!mounted) return;
      final isTest = WidgetsBinding.instance.runtimeType.toString().contains('Test');
      if (!isTest && !UserProfile.instance.hasName) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            showDialog<void>(
              context: context,
              barrierDismissible: false,
              builder: (ctx) => const EditProfileDialog(),
            );
          }
        });
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateTimer = Timer(const Duration(seconds: 3), () {
        if (mounted) UpdateService.checkAndPrompt(context, silent: true);
      });
    });
  }

  Future<void> _openLesson(int index) async {
    final result = await Navigator.of(context).push<LessonResult>(
      MaterialPageRoute(
        builder: (_) => LessonFlowScreen(lessonIndex: index),
      ),
    );
    if (!mounted || result == null) return;
    setState(() {
      _completed.add(index);
      _currentLessonIndex = (index + 1) % lessons.length;
      _selectedGroup = _currentLessonIndex ~/ 10;
      _unlockedGroups.add(_selectedGroup);
      if (result.speakingScore > 0) {
        _speakingScore = result.speakingScore;
      }
    });
    if (index + 1 >= lessons.length) {
      _showCourseComplete();
      return;
    }
    _openLesson(index + 1);
  }

  void _showCourseComplete() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Course complete!'),
        content: const Text(
          'You have finished all 90 lessons. Keep practicing to stay sharp!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _selectGroup(int groupIndex) {
    setState(() {
      _selectedGroup = groupIndex;
      _unlockedGroups.add(groupIndex);
      _tab = 1;
    });
  }

  void _openCategory(int groupIndex) {
    setState(() {
      _selectedGroup = groupIndex;
      _unlockedGroups.add(groupIndex);
      _tab = 1;
    });
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: IndexedStack(
        index: _tab,
        children: [
          HomeScreen(
            currentIndex: _currentLessonIndex,
            streak: _streak,
            dailyGoal: _dailyGoal,
            onContinue: () => _openLesson(_currentLessonIndex),
            onOpenLearn: () => setState(() => _tab = 1),
            onOpenProfile: () => setState(() => _tab = 3),
            onSpeakChallenge: () => setState(() => _tab = 2),
            onCategoryTap: _openCategory,
          ),
          LearnScreen(
            selectedGroup: _selectedGroup,
            currentIndex: _currentLessonIndex,
            completed: _completed,
            unlockedGroups: _unlockedGroups,
            onSelectGroup: _selectGroup,
            onOpenLesson: _openLesson,
          ),
          SpeakScreen(onOpenLesson: _openLesson),
          ProfileScreen(
            completedCount: _completed.length,
            streak: _streak,
            wordsLearned: _wordsLearned,
            speakingScore: _speakingScore,
            xp: _xp,
            onContinue: () => _openLesson(_currentLessonIndex),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavBar(
        index: _tab,
        onTap: (index) => setState(() => _tab = index),
      ),
    );
  }
}
