import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';
import 'user_profile.dart';
import 'update_service.dart';
import 'widgets.dart';

class ProfileScreen extends StatefulWidget {
  final int completedCount;
  final int streak;
  final int wordsLearned;
  final int speakingScore;
  final int xp;
  final VoidCallback onContinue;

  const ProfileScreen({
    super.key,
    required this.completedCount,
    required this.streak,
    required this.wordsLearned,
    required this.speakingScore,
    required this.xp,
    required this.onContinue,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  bool _editingName = false;
  int? _expandedStat; // 0=pronunciation,1=lessons,2=streak
  int? _expandedBadge;

  @override
  void initState() {
    super.initState();
    _nameController.text = UserProfile.instance.displayName;
    UserProfile.instance.load();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  String get _levelLabel {
    final xp = UserProfile.instance.totalXP.value;
    if (xp >= 200) return 'متوسط المستوى 2';
    return 'مبتدئ المستوى 1';
  }

  bool get _level2 => UserProfile.instance.totalXP.value >= 200;

  bool _badgeUnlocked(String id) {
    final up = UserProfile.instance;
    switch (id) {
      case 'first':
        return up.lessonsCompleted.value >= 1;
      case 'explorer':
        return up.lessonsCompleted.value >= 3;
      case 'glow':
        return up.streak.value >= 3;
      case 'gem':
        return up.totalXP.value >= 100;
    }
    return false;
  }

  String _badgeCondition(String id) {
    switch (id) {
      case 'first':
        return 'أكمل درساً واحداً';
      case 'explorer':
        return 'أكمل 3 دروس';
      case 'glow':
        return 'احتفظ بسلسلة 3 أيام';
      case 'gem':
        return 'اجمع 100 XP';
    }
    return '';
  }

  Future<void> _saveName() async {
    final v = _nameController.text.trim();
    if (v.isEmpty) {
      _nameController.text = UserProfile.instance.displayName;
      setState(() => _editingName = false);
      return;
    }
    await UserProfile.instance.save(newName: v);
    setState(() => _editingName = false);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: UserProfile.instance.name,
      builder: (context, name, _) {
        return ValueListenableBuilder<int>(
          valueListenable: UserProfile.instance.totalXP,
          builder: (context, xp, _) {
            return ValueListenableBuilder<int>(
              valueListenable: UserProfile.instance.lessonsCompleted,
              builder: (context, lessons, _) {
                return ValueListenableBuilder<int>(
                  valueListenable: UserProfile.instance.streak,
                  builder: (context, streakVal, _) {
                    return ValueListenableBuilder<int>(
                      valueListenable: UserProfile.instance.pronunciationScore,
                      builder: (context, pron, _) {
                        return SafeArea(
                          bottom: false,
                          child: Center(
                            child: ConstrainedBox(
                              constraints:
                                  const BoxConstraints(maxWidth: kPageMaxWidth),
                              child: SingleChildScrollView(
                                padding:
                                    const EdgeInsets.fromLTRB(20, 12, 20, 28),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.stretch,
                                  children: [
                                    const Center(
                                      child: Text(
                                        'الملف الشخصي',
                                        style: TextStyle(
                                          fontSize: 28,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF1E1B4B),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    Center(
                                      child: ValueListenableBuilder<String>(
                                        valueListenable:
                                            UserProfile.instance.avatar,
                                        builder: (context, avatar, _) {
                                          return Container(
                                            width: 120,
                                            height: 120,
                                            alignment: Alignment.center,
                                            decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: Color(0xFF2563EB),
                                            ),
                                            child: Text(
                                              avatar,
                                              style: const TextStyle(
                                                  fontSize: 56),
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    Center(
                                      child: _editingName
                                          ? SizedBox(
                                              width: 200,
                                              child: TextField(
                                                controller: _nameController,
                                                textAlign: TextAlign.center,
                                                style: const TextStyle(
                                                  fontSize: 28,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.black,
                                                ),
                                                autofocus: true,
                                                onSubmitted: (_) => _saveName(),
                                                decoration:
                                                    const InputDecoration(
                                                  border: UnderlineInputBorder(),
                                                  isDense: true,
                                                ),
                                              ),
                                            )
                                          : GestureDetector(
                                              onTap: () {
                                                _nameController.text =
                                                    UserProfile
                                                        .instance.displayName;
                                                setState(() =>
                                                    _editingName = true);
                                              },
                                              child: Text(
                                                UserProfile
                                                    .instance.displayName,
                                                style: const TextStyle(
                                                  fontSize: 28,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.black,
                                                ),
                                              ),
                                            ),
                                    ),
                                    const SizedBox(height: 12),
                                    Center(
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          _Pill(
                                            text: _levelLabel,
                                            icon: Icons.star_rounded,
                                          ),
                                          const SizedBox(width: 8),
                                          const _Pill(
                                            text: 'متعلم العربية',
                                            icon: Icons.menu_book_rounded,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          '$xp / 200 XP',
                                          textDirection:
                                              TextDirection.ltr,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF2563EB),
                                          ),
                                        ),
                                        const Text(
                                          'تقدم المستوى',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(6),
                                      child: LinearProgressIndicator(
                                        value: (xp / 200).clamp(0.0, 1.0),
                                        minHeight: 12,
                                        backgroundColor:
                                            const Color(0xFFBFDBFE),
                                        valueColor:
                                            const AlwaysStoppedAnimation<
                                                Color>(Color(0xFF2563EB)),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: const [
                                        Icon(Icons.drag_handle_rounded,
                                            size: 16,
                                            color: Color(0xFF9CA3AF)),
                                        SizedBox(width: 4),
                                        Icon(Icons.drag_handle_rounded,
                                            size: 16,
                                            color: Color(0xFF9CA3AF)),
                                      ],
                                    ),
                                    const SizedBox(height: 20),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _StatCard(
                                            icon: Icons.mic_rounded,
                                            value: '$pron%',
                                            label: 'النطق',
                                            expanded: _expandedStat == 0,
                                            onTap: () => setState(() =>
                                                _expandedStat =
                                                    _expandedStat == 0
                                                        ? null
                                                        : 0),
                                            expandedContent:
                                                _expandedStat == 0
                                                    ? Column(
                                                        children: [
                                                          Text(
                                                            'نطقك $pron%',
                                                            style: const TextStyle(
                                                              fontSize: 14,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700,
                                                              color: Color(
                                                                  0xFF2563EB),
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              height: 8),
                                                          FilledButton(
                                                            style: FilledButton
                                                                .styleFrom(
                                                              backgroundColor:
                                                                  const Color(
                                                                      0xFF2563EB),
                                                            ),
                                                            onPressed:
                                                                widget
                                                                    .onContinue,
                                                            child: const Text(
                                                                'تدرب الآن'),
                                                          ),
                                                        ],
                                                      )
                                                    : null,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: _StatCard(
                                            icon: Icons.menu_book_rounded,
                                            value: '$lessons دروس',
                                            label: 'الدروس',
                                            expanded:
                                                _expandedStat == 1,
                                            onTap: () => setState(() =>
                                                _expandedStat =
                                                    _expandedStat == 1
                                                        ? null
                                                        : 1),
                                            expandedContent:
                                                _expandedStat == 1
                                                    ? Column(
                                                        children: [
                                                          Text(
                                                            'أتممت $lessons / 10 دروس',
                                                            style: const TextStyle(
                                                              fontSize: 14,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700,
                                                              color: Color(
                                                                  0xFF2563EB),
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              height: 8),
                                                          ClipRRect(
                                                            borderRadius:
                                                                BorderRadius
                                                                    .circular(
                                                                        6),
                                                            child:
                                                                LinearProgressIndicator(
                                                              value: lessons /
                                                                  10.0,
                                                              minHeight: 8,
                                                              backgroundColor:
                                                                  const Color(
                                                                      0xFFBFDBFE),
                                                              valueColor:
                                                                  const AlwaysStoppedAnimation<
                                                                          Color>(
                                                                      Color(
                                                                          0xFF2563EB)),
                                                            ),
                                                          ),
                                                        ],
                                                      )
                                                    : null,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: _StatCard(
                                            icon: Icons
                                                .local_fire_department_rounded,
                                            value: '$streakVal أيام',
                                            label: 'سلسلة',
                                            expanded:
                                                _expandedStat == 2,
                                            onTap: () => setState(() =>
                                                _expandedStat =
                                                    _expandedStat == 2
                                                        ? null
                                                        : 2),
                                            expandedContent:
                                                _expandedStat == 2
                                                    ? Column(
                                                        children: [
                                                          Row(
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children:
                                                                List.generate(
                                                              7,
                                                              (i) => Container(
                                                                width: 24,
                                                                height: 24,
                                                                margin:
                                                                    const EdgeInsets
                                                                        .symmetric(
                                                                            horizontal:
                                                                                2),
                                                                decoration:
                                                                    BoxDecoration(
                                                                  shape: BoxShape
                                                                      .circle,
                                                                  color: i <
                                                                          streakVal
                                                                              .clamp(
                                                                                  0,
                                                                                  7)
                                                                      ? const Color(
                                                                          0xFF2563EB)
                                                                      : const Color(
                                                                          0xFFE5E7EB),
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                          const SizedBox(
                                                              height: 8),
                                                          const Text(
                                                            'كمل اليوم باش تولي 8!',
                                                            style: TextStyle(
                                                              fontSize: 12,
                                                              color: Color(
                                                                  0xFF6B7280),
                                                            ),
                                                          ),
                                                        ],
                                                      )
                                                    : null,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 24),
                                    const Text(
                                      'الشارات',
                                      style: TextStyle(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF1E1B4B),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    GridView.count(
                                      shrinkWrap: true,
                                      physics:
                                          const NeverScrollableScrollPhysics(),
                                      crossAxisCount: 2,
                                      mainAxisSpacing: 10,
                                      crossAxisSpacing: 10,
                                      childAspectRatio: 1.4,
                                      children: [
                                        _BadgeCard(
                                          icon: Icons.explore_rounded,
                                          label: 'المستكشف',
                                          unlocked: _badgeUnlocked('explorer'),
                                          expanded:
                                              _expandedBadge == 0,
                                          onTap: () => setState(() =>
                                              _expandedBadge =
                                                  _expandedBadge == 0
                                                      ? null
                                                      : 0),
                                          condition: _badgeCondition(
                                              'explorer'),
                                        ),
                                        _BadgeCard(
                                          icon: Icons.emoji_events_rounded,
                                          label: 'الإنجاز الأول',
                                          unlocked: _badgeUnlocked('first'),
                                          expanded:
                                              _expandedBadge == 1,
                                          onTap: () => setState(() =>
                                              _expandedBadge =
                                                  _expandedBadge == 1
                                                      ? null
                                                      : 1),
                                          condition: _badgeCondition(
                                              'first'),
                                        ),
                                        _BadgeCard(
                                          icon: Icons.diamond_rounded,
                                          label: 'الجوهرة',
                                          unlocked: _badgeUnlocked('gem'),
                                          expanded:
                                              _expandedBadge == 2,
                                          onTap: () => setState(() =>
                                              _expandedBadge =
                                                  _expandedBadge == 2
                                                      ? null
                                                      : 2),
                                          condition: _badgeCondition('gem'),
                                        ),
                                        _BadgeCard(
                                          icon: Icons
                                              .local_fire_department_rounded,
                                          label: 'المتوهج',
                                          unlocked: _badgeUnlocked('glow'),
                                          expanded:
                                              _expandedBadge == 3,
                                          onTap: () => setState(() =>
                                              _expandedBadge =
                                                  _expandedBadge == 3
                                                      ? null
                                                      : 3),
                                          condition: _badgeCondition(
                                              'glow'),
                                        ),
                                      ],
                                    ),
                                    if (_expandedBadge != null) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDBEAFE),
                                          borderRadius:
                                              BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          _badgeCondition(
                                            ['explorer', 'first', 'gem', 'glow']
                                                [_expandedBadge!],
                                          ),
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: Color(0xFF1E3A8A),
                                          ),
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 80),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  },
                );
              },
            );
          },
        );
      },
    );
  }
}

class _Pill extends StatelessWidget {
  final String text;
  final IconData icon;
  const _Pill({required this.text, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFF2563EB), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF2563EB)),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2563EB),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final bool expanded;
  final VoidCallback onTap;
  final Widget? expandedContent;
  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.expanded,
    required this.onTap,
    this.expandedContent,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFDBEAFE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF2563EB), size: 24),
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Color(0xFF2563EB),
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
              ),
            ),
            if (expanded && expandedContent != null) ...[
              const SizedBox(height: 8),
              expandedContent!,
            ],
          ],
        ),
      ),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool unlocked;
  final bool expanded;
  final VoidCallback onTap;
  final String condition;
  const _BadgeCard({
    required this.icon,
    required this.label,
    required this.unlocked,
    required this.expanded,
    required this.onTap,
    required this.condition,
  });

  @override
  Widget build(BuildContext context) {
    final color = unlocked
        ? const Color(0xFF2563EB)
        : const Color(0xFF9CA3AF);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFDBEAFE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: unlocked
                    ? const Color(0xFF1E3A8A)
                    : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
