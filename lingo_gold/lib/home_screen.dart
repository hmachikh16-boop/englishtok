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
  final ValueChanged<int> onCategoryTap;

  const HomeScreen({
    super.key,
    required this.currentIndex,
    required this.streak,
    required this.dailyGoal,
    required this.onContinue,
    required this.onOpenLearn,
    required this.onOpenProfile,
    required this.onSpeakChallenge,
    required this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    final lesson = lessons[currentIndex];
    final groupIndex = currentIndex ~/ 10;
    final group = groups[groupIndex];
    final lessonInGroup = (currentIndex % 10) + 1;

    return SafeArea(
      bottom: false,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: kPageMaxWidth),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HomeTopBar(onOpenProfile: onOpenProfile),
                const SizedBox(height: 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: ValueListenableBuilder<String>(
                        valueListenable: UserProfile.instance.name,
                        builder: (context, name, _) {
                          final display = name.trim().isEmpty ? '...' : name.trim();
                          return Text(
                            'أهلاً $display 👋',
                            style: const TextStyle(
                              fontSize: 30,
                              height: 1.1,
                              fontWeight: FontWeight.w800,
                              color: kInk,
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Pill(
                      text: 'أيام متتالية: $streak',
                      icon: Icons.local_fire_department_rounded,
                      background: kSoftOrange,
                      foreground: const Color(0xFFD97706),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'جاهز لمتابعة التعلم اليوم؟',
                  style: TextStyle(
                    fontSize: 14,
                    color: kMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 18),
                _DailyGoalCard(progress: dailyGoal),
                const SizedBox(height: 14),
                _ContinueCard(
                  lesson: lesson,
                  groupName: group.name,
                  unit: groupIndex + 1,
                  lessonNumber: lessonInGroup,
                  onContinue: onContinue,
                ),
                const SizedBox(height: 22),
                const SectionTitle(title: 'تقدمك هذا الأسبوع'),
                const SizedBox(height: 10),
                const _WeekProgress(),
                const SizedBox(height: 22),
                SectionTitle(
                  title: 'التصنيفات',
                  action: 'عرض الكل',
                  onAction: onOpenLearn,
                ),
                const SizedBox(height: 10),
                _CategoriesGrid(onTap: onCategoryTap),
                const SizedBox(height: 22),
                _ChallengeBanner(onTap: onSpeakChallenge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HomeTopBar extends StatelessWidget {
  final VoidCallback onOpenProfile;
  const _HomeTopBar({required this.onOpenProfile});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Align(
            alignment: Alignment.centerLeft,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: BrandMark(),
            ),
          ),
        ),
        Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('لا توجد إشعارات جديدة')),
                );
              },
              icon: const Icon(
                Icons.notifications_none_rounded,
                color: kInk,
                size: 26,
              ),
            ),
            const Positioned(
              right: 11,
              top: 10,
              child: CircleAvatar(radius: 4, backgroundColor: kDanger),
            ),
          ],
        ),
        const SizedBox(width: 4),
        AppAvatar(onTap: onOpenProfile),
      ],
    );
  }
}

class _DailyGoalCard extends StatelessWidget {
  final int progress;
  const _DailyGoalCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'هدف اليوم',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '10 minutes • $progress% complete',
                  style: const TextStyle(
                    fontSize: 13,
                    color: kMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 78,
                  height: 78,
                  child: CircularProgressIndicator(
                    value: progress / 100,
                    strokeWidth: 9,
                    strokeCap: StrokeCap.round,
                    color: kPrimary,
                    backgroundColor: kSoftGreen,
                  ),
                ),
                Text(
                  '$progress%',
                  style: const TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                    color: kPrimaryDark,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ContinueCard extends StatelessWidget {
  final Lesson lesson;
  final String groupName;
  final int unit;
  final int lessonNumber;
  final VoidCallback onContinue;

  const _ContinueCard({
    required this.lesson,
    required this.groupName,
    required this.unit,
    required this.lessonNumber,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 104,
              height: 132,
              child: LessonImage(lesson: lesson),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                const Text(
                  'متابعة التعلم',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'الإنجليزية • $groupName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    color: kMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Pill(text: 'الوحدة $unit • الدرس $lessonNumber'),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 42,
                  child: FilledButton(
                    onPressed: onContinue,
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(0, 42),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(11),
                      ),
                    ),
                    child: const Text('متابعة'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WeekProgress extends StatelessWidget {
  const _WeekProgress();

  @override
  Widget build(BuildContext context) {
    const days = ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'];
    final today = DateTime.now().weekday;
    return Row(
      children: List.generate(7, (i) {
        final dayNumber = i + 1;
        final isToday = dayNumber == today;
        final isPast = dayNumber < today;
        final bg = isPast
            ? kPrimary
            : (isToday ? Colors.white : Colors.white);
        final border = isPast
            ? kPrimary
            : (isToday ? kPrimary : kLine);
        final fg = isPast
            ? Colors.white
            : (isToday ? kPrimary : kMuted);
        return Expanded(
          child: Column(
            children: [
              Container(
                width: 36,
                height: 36,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: bg,
                  shape: BoxShape.circle,
                  border: Border.all(color: border, width: 1.5),
                ),
                child: Text(
                  days[i],
                  style: TextStyle(
                    fontSize: 10,
                    color: fg,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                height: 14,
                child: isToday
                    ? const Text(
                        'اليوم',
                        style: TextStyle(
                          fontSize: 10,
                          color: kPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    : null,
              ),
            ],
          ),
        );
      }),
    );
  }
}

class _Category {
  final String label;
  final int groupIndex;
  final int imageLessonIndex;
  final Color color;
  const _Category(
    this.label,
    this.groupIndex,
    this.imageLessonIndex,
    this.color,
  );
}

const _categories = [
  _Category('التحية', 8, 80, Color(0xFF16A6A6)),
  _Category('الحيوانات', 5, 50, Color(0xFFF5A623)),
  _Category('الطعام', 3, 30, Color(0xFFEF5B6B)),
  _Category('العائلة', 1, 17, Color(0xFF2E9E5B)),
  _Category('المهن', 9, 90, Color(0xFF8B5CF6)),
  _Category('الأرقام', 11, 110, Color(0xFF1E6FDB)),
  _Category('الألوان', 13, 130, Color(0xFFEC4899)),
];

class _CategoriesGrid extends StatelessWidget {
  final ValueChanged<int> onTap;
  const _CategoriesGrid({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _categories.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.12,
      ),
      itemBuilder: (context, i) {
        final category = _categories[i];
        final lesson = lessons[category.imageLessonIndex];
        return _CategoryCard(
          category: category,
          lesson: lesson,
          onTap: () => onTap(category.groupIndex),
        );
      },
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final _Category category;
  final Lesson lesson;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.lesson,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(kRadius),
        onTap: onTap,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(kRadius),
          child: Stack(
            fit: StackFit.expand,
            children: [
              LessonImage(lesson: lesson),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      category.color.withValues(alpha: 0.94),
                      category.color.withValues(alpha: 0.42),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        shadows: [
                          Shadow(color: Color(0x55000000), blurRadius: 8),
                        ],
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '10 دروس',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        shadows: [
                          Shadow(color: Color(0x55000000), blurRadius: 8),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Align(
                      alignment: Alignment.bottomRight,
                      child: Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.22),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white,
                          size: 17,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChallengeBanner extends StatelessWidget {
  final VoidCallback onTap;
  const _ChallengeBanner({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [kPrimary, Color(0xFF16A6A6)],
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x332E9E5B),
                blurRadius: 22,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              const CircleIcon(
                icon: Icons.mic_rounded,
                background: Color(0x33FFFFFF),
                foreground: Colors.white,
                size: 52,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "تحدي اليوم",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'تحدث 5 جمل',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Pill(
                      text: 'مكافأة 50 نجمة',
                      icon: Icons.star_rounded,
                      background: const Color(0x33FFFFFF),
                      foreground: Colors.white,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 46,
                height: 46,
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow_rounded,
                  color: kPrimary,
                  size: 30,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
