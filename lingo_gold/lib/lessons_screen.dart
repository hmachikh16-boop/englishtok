import 'package:flutter/material.dart';

import 'data.dart';
import 'lesson_flow.dart';
import 'theme.dart';

class LessonsScreen extends StatelessWidget {
  final void Function(int lessonId) onStartLesson;
  const LessonsScreen({super.key, required this.onStartLesson});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        itemCount: 10,
        itemBuilder: (context, groupIndex) {
          final start = groupIndex * 10;
          final end = start + 10;
          final groupName = groups[groupIndex].name;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 16, 4, 8),
                child: Text(
                  'الفئة ${groupIndex + 1}: $groupName',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
              ),
              ...List.generate(10, (i) {
                final idx = start + i;
                final lesson = lessons[idx];
                final lessonNumber = idx + 1;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: const BorderSide(color: kLine),
                  ),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: kSoftGreen,
                      foregroundColor: kPrimaryDark,
                      child: Text(
                        '$lessonNumber',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    title: Text(
                      lesson.word,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: kInk,
                      ),
                    ),
                    subtitle: Text(
                      lesson.translation,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: kMuted,
                      ),
                    ),
                    trailing: const Icon(
                      Icons.play_arrow_rounded,
                      color: kPrimary,
                    ),
                    onTap: () => onStartLesson(lessonNumber),
                  ),
                );
              }),
            ],
          );
        },
      ),
    );
  }
}
