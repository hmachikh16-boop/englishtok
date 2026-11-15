import 'package:flutter/material.dart';

import 'theme.dart';
import 'update_service.dart';
import 'widgets.dart';

class ProfileScreen extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
                Row(
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'الملف الشخصي',
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
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: kLine),
                      ),
                      child: IconButton(
                        onPressed: () => _showSettings(context),
                        icon: const Icon(
                          Icons.settings_outlined,
                          color: kInk,
                          size: 22,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SoftCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 76,
                            height: 76,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(0xFF16A6A6), kPrimary],
                              ),
                              border: Border.all(
                                color: Colors.white,
                                width: 3,
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x2216A6A6),
                                  blurRadius: 16,
                                  offset: Offset(0, 6),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.face_rounded,
                              color: Colors.white,
                              size: 40,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Sara',
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: kInk,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                const Text(
                                  'مبتدئ • المستوى 1',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    color: kMuted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 7),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: [
                                    const Pill(
                                      text: 'متعلم إنجليزية',
                                      icon: Icons.language_rounded,
                                      background: kSoftBlue,
                                      foreground: kSecondary,
                                    ),
                                    Pill(
                                      text: '$xp XP',
                                      icon: Icons.bolt_rounded,
                                      background: kSoftOrange,
                                      foreground: const Color(0xFFD97706),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: StatTile(
                              icon: Icons.local_fire_department_rounded,
                              value: '$streak',
                              label: 'سلسلة أيام',
                              color: const Color(0xFFF97316),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: StatTile(
                              icon: Icons.menu_book_rounded,
                              value: '$completedCount',
                              label: 'الدروس',
                              color: kSecondary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: StatTile(
                              icon: Icons.stars_rounded,
                              value: '$xp',
                              label: 'XP المكتسبة',
                              color: kGold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                const SectionTitle(title: 'تقدمك'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: StatTile(
                        icon: Icons.local_fire_department_rounded,
                        value: '$streak',
                        label: 'سلسلة أيام',
                        color: const Color(0xFFF97316),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: StatTile(
                        icon: Icons.auto_stories_rounded,
                        value: '$wordsLearned',
                        label: 'الكلمات المكتسبة',
                        color: kPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: StatTile(
                        icon: Icons.mic_rounded,
                        value: '$speakingScore%',
                        label: 'نتيجة التحدث',
                        color: kSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const _WeeklyChart(),
                const SizedBox(height: 20),
                const SectionTitle(title: 'الشارات'),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 2.0,
                  children: const [
                    _Badge(
                      icon: Icons.emoji_events_rounded,
                      title: 'الدرس الأول',
                      subtitle: 'مكتسب',
                      color: kGold,
                    ),
                    _Badge(
                      icon: Icons.explore_rounded,
                      title: 'مستكشف',
                      subtitle: 'مكتسب',
                      color: kSecondary,
                    ),
                    _Badge(
                      icon: Icons.local_fire_department_rounded,
                      title: 'سلسلة 3 أيام',
                      subtitle: 'مكتسب',
                      color: Color(0xFFF97316),
                    ),
                    _Badge(
                      icon: Icons.layers_rounded,
                      title: 'جامع كلمات',
                      subtitle: 'مكتسب',
                      color: Color(0xFF8B5CF6),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: onContinue,
                    icon: const Icon(Icons.play_arrow_rounded, size: 22),
                    label: const Text('متابعة التعلم'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSettings(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _SettingsSheet(),
    );
  }
}

class _Badge extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;

  const _Badge({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: kLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleIcon(
            icon: icon,
            background: color.withValues(alpha: 0.15),
            foreground: color,
            size: 40,
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: kMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.check_circle_rounded, color: kPrimary, size: 16),
        ],
      ),
    );
  }
}

class _WeeklyChart extends StatelessWidget {
  const _WeeklyChart();

  static const _values = [18.0, 30.0, 22.0, 42.0, 34.0, 54.0, 26.0];
  static const _days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'النشاط الأسبوعي',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'تدريبك هذا الأسبوع',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: kMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const Pill(
                text: 'المجموع 42 دقيقة',
                icon: Icons.timer_outlined,
                background: kSoftGreen,
                foreground: kPrimaryDark,
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 110,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final h = 12 + (_values[i] / 54.0) * 64.0;
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      SizedBox(
                        height: 76,
                        child: Stack(
                          alignment: Alignment.bottomCenter,
                          children: [
                            Container(
                              width: 18,
                              height: 76,
                              decoration: BoxDecoration(
                                color: kSoftGreen,
                                borderRadius: BorderRadius.circular(7),
                              ),
                            ),
                            Container(
                              width: 18,
                              height: h,
                              decoration: BoxDecoration(
                                color: i == 5 ? kPrimary : kPrimary,
                                borderRadius: BorderRadius.circular(7),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        _days[i],
                        style: const TextStyle(
                          fontSize: 10,
                          color: kMuted,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsSheet extends StatefulWidget {
  const _SettingsSheet();

  @override
  State<_SettingsSheet> createState() => _SettingsSheetState();
}

class _SettingsSheetState extends State<_SettingsSheet> {
  bool sound = true;
  bool music = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: kLine,
                  borderRadius: BorderRadius.circular(99),
                ),
              ),
              const SizedBox(height: 14),
              const Row(
                children: [
                  Expanded(
                    child: Text(
                      'الإعدادات',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                  ),
                  BrandMark(compact: true),
                ],
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeTrackColor: kPrimary,
                title: const Text(
                  'المؤثرات الصوتية',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text('أصوات التغذية والإجابة'),
                value: sound,
                onChanged: (value) => setState(() => sound = value),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeTrackColor: kPrimary,
                title: const Text(
                  'الموسيقى',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text('موسيقى التعلم في الخلفية'),
                value: music,
                onChanged: (value) => setState(() => music = value),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleIcon(
                  icon: Icons.system_update_rounded,
                  background: kSoftGreen,
                  foreground: kPrimary,
                  size: 40,
                ),
                title: const Text(
                  'التحقق من التحديثات',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: const Text('تحميل وتثبيت أحدث إصدار'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {
                  Navigator.pop(context);
                  UpdateService.checkAndPrompt(context);
                },
              ),
              const Divider(height: 24),
              const ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleIcon(
                  icon: Icons.info_outline_rounded,
                  background: kSoftBlue,
                  foreground: kSecondary,
                  size: 40,
                ),
                title: Text(
                  'تعلم',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text('Lingo Gold • الإصدار 1.0.0'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
