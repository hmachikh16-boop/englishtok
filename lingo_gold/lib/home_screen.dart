import 'package:flutter/material.dart';

import 'data.dart' as legacy;

const Color kHomeBlue = Color(0xFF2563EB);
const Color kHomeInk = Color(0xFF111827);
const Color kHomeMuted = Color(0xFF9CA3AF);

class HomeScreen extends StatelessWidget {
  final int currentLessonId; // 1..100
  final int completedLessons;
  final int totalLessons;
  final int stars;
  final VoidCallback onStart;

  const HomeScreen({
    super.key,
    required this.currentLessonId,
    required this.completedLessons,
    required this.totalLessons,
    required this.stars,
    required this.onStart,
  });

  @override
  Widget build(BuildContext context) {
    final lesson =
        legacy.lessons[(currentLessonId - 1).clamp(0, totalLessons - 1)];
    final group =
        legacy.groups[((currentLessonId - 1) ~/ 10).clamp(0, 9)];
    final progress =
        totalLessons == 0 ? 0.0 : (completedLessons / totalLessons).clamp(0.0, 1.0);
    final allDone = completedLessons >= totalLessons;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ===== Header card =====
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x12000000),
                      blurRadius: 10,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Lingo Gold',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              color: kHomeBlue,
                            ),
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'تقدمك اليوم',
                              style: TextStyle(
                                fontSize: 13,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            Text(
                              '$completedLessons / $totalLessons',
                              textDirection: TextDirection.ltr,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF374151),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 8,
                        backgroundColor: const Color(0xFFDBEAFE),
                        valueColor:
                            const AlwaysStoppedAnimation<Color>(kHomeBlue),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Row(
                          children: [
                            const Text('⭐', style: TextStyle(fontSize: 15)),
                            const SizedBox(width: 4),
                            Text(
                              '$stars نجمة',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        Flexible(
                          child: Text(
                            group.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: kHomeBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 70),

              // ===== Current lesson =====
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 22, vertical: 9),
                    decoration: BoxDecoration(
                      color: kHomeBlue,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'الدرس الحالي',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    allDone
                        ? 'أتممت كل الدروس! 🎉'
                        : 'الدرس رقم $currentLessonId',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w900,
                      color: kHomeInk,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Directionality(
                    textDirection: TextDirection.ltr,
                    child: Text(
                      lesson.word,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kHomeBlue,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    lesson.translation,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      color: kHomeMuted,
                    ),
                  ),
                  const SizedBox(height: 36),
                  SizedBox(
                    width: 280,
                    height: 72,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kHomeBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(36),
                        ),
                        elevation: 8,
                      ),
                      onPressed: onStart,
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.play_arrow_rounded,
                                color: Colors.white, size: 32),
                            const SizedBox(width: 8),
                            Text(
                              allDone ? 'إعادة من البداية' : 'ابدأ الدرس',
                              style: const TextStyle(
                                fontSize: 23,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    '6 نوافذ • تلوين',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: kHomeMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
