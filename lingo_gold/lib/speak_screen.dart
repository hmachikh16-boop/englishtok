import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';
import 'widgets.dart';

class SpeakScreen extends StatelessWidget {
  final ValueChanged<int> onOpenLesson;

  const SpeakScreen({super.key, required this.onOpenLesson});

  @override
  Widget build(BuildContext context) {
    final speakingLessons = List.generate(10, (i) => 80 + i);
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تحدث',
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
                    const CircleIcon(
                      icon: Icons.mic_rounded,
                      background: kSoftBlue,
                      foreground: kSecondary,
                      size: 46,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [kSecondary, Color(0xFF16A6A6)],
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x331E6FDB),
                        blurRadius: 22,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const CircleIcon(
                        icon: Icons.graphic_eq_rounded,
                        background: Color(0x33FFFFFF),
                        foreground: Colors.white,
                        size: 54,
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'تحدث بثقة',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'استمع، كرر، واحصل على تغذية فورية.',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12.5,
                                height: 1.35,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          onPressed: () => onOpenLesson(speakingLessons.first),
                          icon: const Icon(
                            Icons.play_arrow_rounded,
                            color: kSecondary,
                            size: 27,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                SectionTitle(
                  title: 'دروس التحدث',
                  action: '${speakingLessons.length} دروس',
                ),
                const SizedBox(height: 10),
                ...speakingLessons.map((index) {
                  final lesson = lessons[index];
                  final sentence =
                      lesson.sentence.replaceAll('___', lesson.word);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _SpeakingRow(
                      lesson: lesson,
                      number: (index % 10) + 1,
                      sentence: sentence,
                      onTap: () => onOpenLesson(index),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SpeakingRow extends StatelessWidget {
  final Lesson lesson;
  final int number;
  final String sentence;
  final VoidCallback onTap;

  const _SpeakingRow({
    required this.lesson,
    required this.number,
    required this.sentence,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(kRadius),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(11),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(kRadius),
            border: Border.all(color: kLine),
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
              ClipRRect(
                borderRadius: BorderRadius.circular(13),
                child: SizedBox(
                  width: 62,
                  height: 62,
                  child: LessonImage(lesson: lesson),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الدرس $number',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: kMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      sentence,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.25,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'التحية • تدريب التحدث',
                      style: TextStyle(
                        fontSize: 11,
                        color: kMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const CircleIcon(
                icon: Icons.mic_rounded,
                background: kSoftGreen,
                foreground: kPrimary,
                size: 40,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
