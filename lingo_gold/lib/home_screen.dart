import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';
import 'user_profile.dart';

class HomeScreen extends StatelessWidget {
  final int currentIndex;
  final int streak;
  final int dailyGoal;
  final VoidCallback onContinue;
  final VoidCallback onOpenLearn;
  final VoidCallback onOpenProfile;
  final VoidCallback onSpeakChallenge;
  final Set<int> completed;
  final ValueChanged<int> onOpenPathNode;

  const HomeScreen({
    super.key,
    required this.currentIndex,
    required this.streak,
    required this.dailyGoal,
    required this.onContinue,
    required this.onOpenLearn,
    required this.onOpenProfile,
    required this.onSpeakChallenge,
    required this.completed,
    required this.onOpenPathNode,
  });

  Set<int> get _completedPath {
    final result = <int>{};
    for (var p = 0; p < pathOrder.length; p++) {
      final g = pathOrder[p];
      final anyDone = List.generate(10, (i) => g * 10 + i)
          .any(completed.contains);
      if (anyDone) result.add(p);
    }
    return result;
  }

  bool _isUnlocked(int p, Set<int> done) {
    if (p == 0) return true;
    return done.contains(p - 1);
  }

  @override
  Widget build(BuildContext context) {
    final done = _completedPath;
    final completedCount = done.length;
    final total = pathOrder.length;
    final progress = total == 0 ? 0.0 : completedCount / total;
    final todayDone = completedCount.clamp(0, 10);
    final todayTotal = 10;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _HeaderCard(
                progress: progress,
                todayDone: todayDone,
                todayTotal: todayTotal,
              ),
              const SizedBox(height: 24),
              ...List.generate(pathOrder.length, (i) {
                final unlocked = _isUnlocked(i, done);
                final completedNode = done.contains(i);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 32),
                  child: Column(
                    children: [
                      _LessonCircle(
                        unlocked: unlocked,
                        completed: completedNode,
                        onTap: () {
                          if (!unlocked) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                    'أكمل الدرس السابق لفتح هذا الدرس!'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                            return;
                          }
                          onOpenPathNode(i);
                        },
                      ),
                      const SizedBox(height: 12),
                      _LabelPill(text: _labelFor(i)),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  String _labelFor(int i) {
    const ordinals = [
      'الأول',
      'الثاني',
      'الثالث',
      'الرابع',
      'الخامس',
      'السادس',
      'السابع',
      'الثامن',
      'التاسع',
      'العاشر',
      'الحادي عشر',
      'الثاني عشر',
      'الثالث عشر',
      'الرابع عشر',
    ];
    return 'الدرس ${ordinals[i]}: ${pathLabelsAr[i]}';
  }
}

class _HeaderCard extends StatelessWidget {
  final double progress;
  final int todayDone;
  final int todayTotal;
  const _HeaderCard({
    required this.progress,
    required this.todayDone,
    required this.todayTotal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: const Text(
                  'تعلم العربية',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1DB954),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'تقدمك اليوم',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  Text(
                    '$todayDone / $todayTotal',
                    textDirection: TextDirection.ltr,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF374151),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: const Color(0xFFE5E7EB),
              valueColor:
                  const AlwaysStoppedAnimation<Color>(Color(0xFF1DB954)),
            ),
          ),
        ],
      ),
    );
  }
}

class _LessonCircle extends StatelessWidget {
  final bool unlocked;
  final bool completed;
  final VoidCallback onTap;
  const _LessonCircle({
    required this.unlocked,
    required this.completed,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isUnlocked = unlocked;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        height: 160,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: (completed || isUnlocked)
              ? const Color(0xFF1DB954)
              : const Color(0xFFE5E7EB),
        ),
        child: Center(
          child: completed
              ? const Icon(Icons.check_rounded,
                  color: Colors.white, size: 72)
              : (isUnlocked
                  ? const Icon(Icons.waving_hand_rounded,
                      color: Colors.white, size: 72)
                  : const Icon(Icons.lock_rounded,
                      color: Color(0xFF9CA3AF), size: 64)),
        ),
      ),
    );
  }
}

class _LabelPill extends StatelessWidget {
  final String text;
  const _LabelPill({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFD1D5DB)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Color(0xFF4B5563),
        ),
      ),
    );
  }
}
