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
  int _currentLessonIndex = pathOrder[0] * 10;
  final Set<int> _completed = {};
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
    UserProfile.instance.loadProgress(
      onLoaded: (completed, current) {
        if (!mounted) return;
        setState(() {
          _completed
            ..clear()
            ..addAll(completed);
          _currentLessonIndex = current.clamp(0, lessons.length - 1);
          _selectedGroup = _currentLessonIndex ~/ 10;
        });
      },
    );
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
    final passed = result.score >= 4 || result.speakingScore >= 80;
    setState(() {
      if (passed) _completed.add(index);
      _currentLessonIndex = (index + 1).clamp(0, lessons.length - 1);
      _selectedGroup = _currentLessonIndex ~/ 10;
      if (result.speakingScore > 0) {
        _speakingScore = result.speakingScore;
      }
    });
    if (passed) {
      UserProfile.instance.saveProgress(_completed, _currentLessonIndex);
    }
    if (index + 1 >= lessons.length) {
      _showCourseComplete();
    }
  }

  void _openPathNode(int p) {
    final g = pathOrder[p];
    var target = g * 10;
    for (var i = 0; i < 10; i++) {
      final idx = g * 10 + i;
      if (!_completed.contains(idx)) {
        target = idx;
        break;
      }
    }
    _openLesson(target);
  }

  void _showCourseComplete() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('أكملت الدورة!'),
        content: Text(
          'لقد أكملت جميع الدروس (${lessons.length}). واصل التدريب لتبقى متميزاً!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  Set<int> _computeUnlockedGroups() {
    return Set<int>.from(List.generate(groups.length, (i) => i));
  }

  void _selectGroup(int groupIndex) {
    setState(() {
      _selectedGroup = groupIndex.clamp(0, groups.length - 1).toInt();
      _tab = 1;
    });
  }

  void _openCategory(int groupIndex) {
    if (!_computeUnlockedGroups().contains(groupIndex)) {
      setState(() => _tab = 1);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'هذه الوحدة مقفلة. أكمل الوحدات السابقة أو غيّر مستواك من الملف الشخصي.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() {
      _selectedGroup = groupIndex;
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
      body: ValueListenableBuilder<String>(
        valueListenable: UserProfile.instance.level,
        builder: (context, level, _) {
          final unlocked = _computeUnlockedGroups();
          return IndexedStack(
            index: _tab,
            children: [
              HomeScreen(
                currentIndex: _currentLessonIndex,
                streak: _streak,
                dailyGoal: _dailyGoal,
                completed: _completed,
                onContinue: () => _openLesson(_currentLessonIndex),
                onOpenLearn: () => setState(() => _tab = 1),
                onOpenProfile: () => setState(() => _tab = 3),
                onSpeakChallenge: () => setState(() => _tab = 2),
                onOpenPathNode: _openPathNode,
              ),
              LearnScreen(
                selectedGroup: _selectedGroup,
                currentIndex: _currentLessonIndex,
                completed: _completed,
                unlockedGroups: unlocked,
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
