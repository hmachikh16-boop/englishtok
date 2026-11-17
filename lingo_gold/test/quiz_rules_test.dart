import 'package:flutter_test/flutter_test.dart';
import 'package:lingo_gold/course.dart';

void main() {
  group('100-lesson activity rules', () {
    test('every activity has exactly one correct option', () {
      for (final lesson in courseLessons) {
        for (final type in ActivityType.values) {
          for (final d in Difficulty.values) {
            final a = buildActivity(lesson, type, d);
            if (type == ActivityType.matching) {
              expect(a.pairs, isNotNull);
              expect(a.pairs!.length, 3,
                  reason: 'lesson ${lesson.id} $type $d');
              expect(
                a.pairs!.map((p) => p.left).toSet().length,
                a.pairs!.length,
                reason: 'duplicate match prompt in lesson ${lesson.id} $d',
              );
            } else {
              expect(a.options.length, 4,
                  reason: 'lesson ${lesson.id} $type $d');
              expect(
                a.options.where((o) => o.isCorrect).length,
                1,
                reason: 'lesson ${lesson.id} $type $d',
              );
            }
          }
        }
      }
    });

    test('coloring gives five pages per lesson', () {
      for (final lesson in courseLessons) {
        final pages = coloringPagesFor(lesson.id);
        expect(pages.length, 5);
        for (final p in pages) {
          expect(p, startsWith('assets/coloring/coloring_'));
        }
      }
    });

    test('lesson 1 is Hello and lesson 100 is Wind', () {
      expect(courseLessons.first.word, 'Hello');
      expect(courseLessons.last.word, 'Wind');
      expect(courseLessons[20].word, 'Cat');
      expect(courseLessons[35].word, 'Apple');
      expect(courseLessons[50].word, 'One');
      expect(courseLessons[70].word, 'Policeman');
      expect(courseLessons[85].word, 'Sun');
    });
  });
}
