import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';
import 'user_profile.dart';
import 'widgets.dart';

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
    final progress = pathOrder.isEmpty
        ? 0.0
        : completedCount / pathOrder.length;
    final levelLabel = 'مستوى ${UserProfile.instance.level.value}';

    return SafeArea(
      bottom: false,
      child: Column(
        children: [
          _Header(
            level: levelLabel,
            progressPercent: (progress * 100).round(),
            hearts: 5,
            gems: 120,
            progress: progress,
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              child: _PathView(
                completed: done,
                isUnlocked: (p) => _isUnlocked(p, done),
                onOpen: onOpenPathNode,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String level;
  final int progressPercent;
  final int hearts;
  final int gems;
  final double progress;
  const _Header({
    required this.level,
    required this.progressPercent,
    required this.hearts,
    required this.gems,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      decoration: const BoxDecoration(
        color: kPrimary,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  level,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _Stat(icon: Icons.favorite_rounded, value: '$hearts', color: Colors.redAccent),
              const SizedBox(width: 12),
              _Stat(icon: Icons.diamond_rounded, value: '$gems', color: Colors.amber),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'تقدمك $progressPercent%',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'أكمل الدرس الأول لفتح الدرس التالي!',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value;
  final Color color;
  const _Stat({required this.icon, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _PathView extends StatelessWidget {
  final Set<int> completed;
  final bool Function(int) isUnlocked;
  final ValueChanged<int> onOpen;
  const _PathView({
    required this.completed,
    required this.isUnlocked,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    final children = <Widget>[];
    for (var i = 0; i < pathOrder.length; i++) {
      final unlocked = isUnlocked(i);
      final done = completed.contains(i);
      final align = i == 0
          ? Alignment.center
          : (i.isOdd ? Alignment.centerRight : Alignment.centerLeft);
      children.add(
        Align(
          alignment: align,
          child: Padding(
            padding: EdgeInsets.only(
              left: i.isOdd ? 0 : 8,
              right: i.isOdd ? 8 : 0,
            ),
            child: _Node(
              index: i,
              unlocked: unlocked,
              completed: done,
              onTap: () {
                if (!unlocked) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('أكمل الدرس السابق لفتح هذا الدرس!'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  return;
                }
                onOpen(i);
              },
            ),
          ),
        ),
      );
      if (i < pathOrder.length - 1) {
        children.add(const _Connector());
      }
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    );
  }
}

class _Node extends StatelessWidget {
  final int index;
  final bool unlocked;
  final bool completed;
  final VoidCallback onTap;
  const _Node({
    required this.index,
    required this.unlocked,
    required this.completed,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final size = completed ? 96.0 : (unlocked ? 120.0 : 80.0);
    final color = completed
        ? kPrimary
        : (unlocked ? kPrimary : Colors.grey.shade400);
    final label = '${pathLabelsEn[index]} - ${pathLabelsAr[index]}';
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color,
              boxShadow: unlocked
                  ? [
                      BoxShadow(
                        color: color.withOpacity(0.45),
                        blurRadius: 18,
                        spreadRadius: 2,
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: completed
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 44)
                  : (unlocked
                      ? const Icon(Icons.waving_hand_rounded,
                          color: Colors.white, size: 46)
                      : const Icon(Icons.lock_rounded,
                          color: Colors.white, size: 30)),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: unlocked ? kSoftGreen : Colors.grey.shade200,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: unlocked ? kPrimaryDark : kMuted,
              ),
            ),
          ),
          if (unlocked) ...[
            const SizedBox(height: 2),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.star_rounded, color: kGold, size: 14),
                SizedBox(width: 2),
                Text(
                  '10 XP',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: kGold,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Connector extends StatelessWidget {
  const _Connector();
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: CustomPaint(
        painter: _DottedCurvePainter(),
        size: const Size(double.infinity, 46),
      ),
    );
  }
}

class _DottedCurvePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.grey.shade400
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final path = Path();
    final startX = size.width / 2;
    path.moveTo(startX, 0);
    path.quadraticBezierTo(
      size.width * 0.85,
      size.height / 2,
      size.width / 2,
      size.height,
    );
    // Draw dotted.
    const dashWidth = 4.0;
    const dashSpace = 5.0;
    final metrics = path.computeMetrics().first;
    double distance = 0;
    while (distance < metrics.length) {
      final next = math.min(distance + dashWidth, metrics.length);
      final extract = metrics.extractPath(distance, next);
      canvas.drawPath(extract, paint);
      distance += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
