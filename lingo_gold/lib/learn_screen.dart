import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';
import 'user_profile.dart';
import 'widgets.dart';

class LearnScreen extends StatefulWidget {
  final int selectedGroup;
  final int currentIndex;
  final Set<int> completed;
  final Set<int> unlockedGroups;
  final ValueChanged<int> onSelectGroup;
  final ValueChanged<int> onOpenLesson;

  const LearnScreen({
    super.key,
    required this.selectedGroup,
    required this.currentIndex,
    required this.completed,
    required this.unlockedGroups,
    required this.onSelectGroup,
    required this.onOpenLesson,
  });

  @override
  State<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends State<LearnScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _selectGroup(int groupIndex) {
    final wasLocked = !widget.unlockedGroups.contains(groupIndex);
    widget.onSelectGroup(groupIndex);
    if (wasLocked) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('أكمل الوحدة السابقة لفتح هذه الوحدة'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final groupIndex =
        widget.selectedGroup.clamp(0, groups.length - 1).toInt();
    final group = groups[groupIndex];
    final completedInGroup = List.generate(10, (i) => groupIndex * 10 + i)
        .where(widget.completed.contains)
        .length;
    int? firstIncomplete;
    for (var i = 0; i < 10; i++) {
      final index = groupIndex * 10 + i;
      if (!widget.completed.contains(index)) {
        firstIncomplete = index;
        break;
      }
    }
    final percent = (completedInGroup / 10 * 100).round();

    return SafeArea(
      bottom: false,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: kPageMaxWidth),
          child: SingleChildScrollView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تعلم',
                            style: TextStyle(
                              fontSize: 30,
                              height: 1.1,
                              fontWeight: FontWeight.w800,
                              color: kInk,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Lingo Gold • تعلم',
                            style: TextStyle(
                              fontSize: 12,
                              color: kMuted,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Pill(
                      text: 'الإنجليزية • ${UserProfile.instance.level.value}',
                      icon: Icons.language_rounded,
                      background: kSoftBlue,
                      foreground: kSecondary,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SoftCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                        child: Row(
                          children: [
                            const CircleIcon(
                              icon: Icons.route_rounded,
                              background: kSoftGreen,
                              foreground: kPrimary,
                              size: 44,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'مسار التعلم الخاص بك',
                                    style: TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                      color: kInk,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'الوحدة ${groupIndex + 1} • ${group.name}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: kMuted,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Pill(
                              text: '$percent٪ مكتمل',
                              background: kSoftGreen,
                              foreground: kPrimaryDark,
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: RoundedProgress(
                          value: completedInGroup / 10,
                          height: 7,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _LearningPath extends StatelessWidget {
  final int groupIndex;
  final Set<int> completed;
  final int? firstIncomplete;
  final ValueChanged<int> onOpenLesson;

  const _LearningPath({
    required this.groupIndex,
    required this.completed,
    required this.firstIncomplete,
    required this.onOpenLesson,
  });

  @override
  Widget build(BuildContext context) {
    const spacing = 126.0;
    const top = 34.0;
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final points = List.generate(10, (i) {
          final rawX =
              width / 2 + math.sin(i * 1.15 + 0.4) * (width * 0.24);
          final x = rawX
              .clamp(86.0, math.max(86.0, width - 86.0))
              .toDouble();
          return Offset(x, top + i * spacing);
        });
        final height = top + 9 * spacing + 120;
        return SizedBox(
          height: height,
          child: Stack(
            children: [
              Positioned.fill(
                child: CustomPaint(painter: _PathPainter(points)),
              ),
              ...List.generate(10, (i) {
                final index = groupIndex * 10 + i;
                final isCompleted = completed.contains(index);
                final isCurrent = !isCompleted && firstIncomplete == index;
                final isLocked = firstIncomplete != null &&
                    index > firstIncomplete! &&
                    !isCompleted;
                return Positioned(
                  left: points[i].dx - 85,
                  top: points[i].dy - 28,
                  width: 170,
                  child: _LessonNode(
                    lesson: lessons[index],
                    number: i + 1,
                    completed: isCompleted,
                    current: isCurrent,
                    locked: isLocked,
                    onTap: () {
                      if (isLocked) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'أكمل الدرس السابق لفتح هذا الدرس',
                            ),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                        return;
                      }
                      onOpenLesson(index);
                    },
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }
}

class _PathPainter extends CustomPainter {
  final List<Offset> points;
  _PathPainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    if (points.length < 2) return;
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 1; i < points.length; i++) {
      final previous = points[i - 1];
      final current = points[i];
      final mid = Offset(
        (previous.dx + current.dx) / 2,
        (previous.dy + current.dy) / 2,
      );
      path.quadraticBezierTo(previous.dx, previous.dy, mid.dx, mid.dy);
    }
    path.lineTo(points.last.dx, points.last.dy);

    final base = Paint()
      ..color = kSoftGreen
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    canvas.drawPath(path, base);

    final dash = Paint()
      ..color = kPrimary.withValues(alpha: 0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = math.min(distance + 7, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), dash);
        distance = next + 7;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PathPainter old) => old.points != points;
}

class _LessonNode extends StatelessWidget {
  final Lesson lesson;
  final int number;
  final bool completed;
  final bool current;
  final bool locked;
  final VoidCallback onTap;

  const _LessonNode({
    required this.lesson,
    required this.number,
    required this.completed,
    required this.current,
    required this.locked,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final sentence = lesson.sentence.replaceAll('___', lesson.word);
    final circleColor = completed
        ? kPrimary
        : (current ? Colors.white : kCard);
    final borderColor = completed
        ? kPrimary
        : (current ? kPrimary : kLine);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: circleColor,
              shape: BoxShape.circle,
              border: Border.all(color: borderColor, width: 3),
              boxShadow: current
                  ? const [
                      BoxShadow(
                        color: Color(0x332E9E5B),
                        blurRadius: 16,
                        offset: Offset(0, 5),
                      ),
                    ]
                  : null,
            ),
            child: ClipOval(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  LessonImage(lesson: lesson),
                  if (locked)
                    Container(
                      color: Colors.black.withValues(alpha: 0.45),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.lock_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    )
                  else if (completed)
                    Container(
                      color: kPrimary.withValues(alpha: 0.5),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    )
                  else if (current)
                    Container(
                      color: Colors.black.withValues(alpha: 0.12),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 27,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          'الدرس $number',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: locked ? kMuted : kInk,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          sentence,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 10.5,
            height: 1.25,
            color: locked ? kMuted : kMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
        if (completed) ...[
          const SizedBox(height: 2),
          const StarRow(filled: 3, size: 12),
        ] else if (current) ...[
          const SizedBox(height: 2),
          const Text(
            'ابدأ',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: kPrimary,
              letterSpacing: 0.7,
            ),
          ),
        ],
      ],
    );
  }
}

class _UnitCard extends StatelessWidget {
  final int groupIndex;
  final LessonGroup group;
  final int completed;
  final bool locked;
  final bool selected;
  final bool current;
  final VoidCallback onTap;

  const _UnitCard({
    required this.groupIndex,
    required this.group,
    required this.completed,
    required this.locked,
    required this.selected,
    required this.current,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final complete = completed >= 10;
    final progress = (completed / 10).clamp(0.0, 1.0).toDouble();
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(kRadius),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            color: locked ? kCard : Colors.white,
            borderRadius: BorderRadius.circular(kRadius),
            border: Border.all(
              color: selected ? kPrimary : kLine,
              width: selected ? 1.6 : 1,
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: locked
                      ? const Color(0xFFE8E9EC)
                      : group.color.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  locked ? Icons.lock_outline_rounded : group.icon,
                  color: locked ? kMuted : kInk,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'الوحدة ${groupIndex + 1}',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: kMuted,
                          ),
                        ),
                        if (current) ...[
                          const SizedBox(width: 6),
                          const Pill(
                            text: 'الحالي',
                            padding: EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2,
                            ),
                            background: kSoftGreen,
                            foreground: kPrimaryDark,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      group.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: locked ? kMuted : kInk,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      locked
                          ? 'مقفل • أكمل الوحدة السابقة'
                          : '$completed/10 دروس • ${(progress * 100).round()}%',
                      style: const TextStyle(
                        fontSize: 11,
                        color: kMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 7),
                    RoundedProgress(
                      value: progress,
                      height: 5,
                      color: locked ? const Color(0xFFC9CDD4) : kPrimary,
                      background: const Color(0xFFEDEFF2),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                locked
                    ? Icons.lock_outline_rounded
                    : (complete
                        ? Icons.check_circle_rounded
                        : Icons.chevron_right_rounded),
                color: locked
                    ? kMuted
                    : (complete ? kPrimary : kMuted),
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
