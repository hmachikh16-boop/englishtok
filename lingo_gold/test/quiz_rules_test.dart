import 'package:flutter_test/flutter_test.dart';
import 'package:lingo_gold/data.dart';
import 'package:lingo_gold/lesson_flow.dart';

void main() {
  group('global quiz rules', () {
    test('every lesson gets 3 same-group distractors, no duplicates', () {
      for (var i = 0; i < lessons.length; i++) {
        final lesson = lessons[i];
        final groupIndex = i ~/ 10;
        final distractors = pickDistractors(i, 3);

        expect(distractors.length, 3, reason: 'lesson $i (${lesson.word})');
        final images = <String>{lesson.imageFile};
        final words = <String>{lesson.word.toLowerCase()};

        for (final d in distractors) {
          expect(
            lessons.indexOf(d) ~/ 10,
            groupIndex,
            reason: 'cross-group distractor for lesson $i',
          );
          expect(
            images.add(d.imageFile),
            isTrue,
            reason: 'duplicate image in lesson $i',
          );
          if (groupIndex != 0) {
            expect(
              words.add(d.word.toLowerCase()),
              isTrue,
              reason: 'duplicate word in lesson $i',
            );
          }
        }
      }
    });

    test('numbers are one object (apples) with different counts only', () {
      for (var i = 110; i < 120; i++) {
        final lesson = lessons[i];
        expect(lesson.category, 'Numbers');
        expect(lesson.sentence.contains('apple'), isTrue);
        expect(lesson.translation.contains('تفاح'), isTrue);
      }
    });

    test('colors are one object (a ball) with different colors only', () {
      for (var i = 130; i < 140; i++) {
        final lesson = lessons[i];
        expect(lesson.category, 'Colors');
        expect(lesson.sentence, 'The ball is ___.');
        expect(lesson.translation.contains('الكرة'), isTrue);
      }
    });

    test('jobs and actions never repeat a word inside their group', () {
      for (final range in [
        [90, 100],
        [100, 110],
      ]) {
        final words = <String>{};
        for (var i = range[0]; i < range[1]; i++) {
          expect(
            words.add(lessons[i].word.toLowerCase()),
            isTrue,
            reason: 'duplicate job/action word at $i',
          );
        }
      }
    });
  });
}
