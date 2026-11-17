import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/data.dart';
import 'package:lingo_gold/lesson_coloring.dart';
import 'package:lingo_gold/lesson_flow.dart';
import 'package:lingo_gold/lesson_smart_choose.dart';
import 'package:lingo_gold/widgets.dart';

void main() {
  group('legacy 6-window flow rules', () {
    test('lesson 39 is Grapes with its own image and sentence', () {
      final grapes = lessons[38];
      expect(grapes.word, 'Grapes');
      expect(grapes.imageFile, 'n29');
      expect(grapes.sentence, 'I like ___.');
      expect(
        LessonImage(lesson: grapes).assetPath,
        'assets/images/n29_0.jpg',
      );
    });

    test('lesson 22 keeps its own boy image', () {
      final happy = lessons[21];
      expect(happy.word, 'Happy');
      expect(happy.imageFile, 'n12');
      expect(
        LessonImage(lesson: happy).assetPath,
        'assets/images/n12_0.jpg',
      );
    });

    test('fruit listening distractors stay fruit only', () {
      final distractors = pickDistractors(38, 3);
      expect(distractors.map((l) => l.word).toList(),
          ['Apple', 'Banana', 'Orange']);
      expect(distractors.any((l) => l.word == 'Bread'), isFalse);
      expect(distractors.any((l) => l.word == 'Milk'), isFalse);
    });

    test('food listening distractors stay non-fruit food only', () {
      final distractors = pickDistractors(32, 3);
      expect(distractors.map((l) => l.word).toList(),
          ['Milk', 'Egg', 'Cheese']);
      expect(distractors.any((l) => l.word == 'Apple'), isFalse);
      expect(distractors.any((l) => l.word == 'Grapes'), isFalse);
    });

    test('animal listening distractors stay animals only', () {
      final distractors = pickDistractors(50, 3);
      expect(distractors.map((l) => l.word).toList(),
          ['Cat', 'Bird', 'Fish']);
    });

    test('greeting listening distractors use the same boy actions', () {
      final distractors = pickDistractors(80, 3);
      expect(distractors.map((l) => l.word).toList(),
          ['Goodbye', 'Raise hand', 'Dinner']);
    });

    test('grammar lessons have 3 matching distractors and a non-IS writing word', () {
      for (var i = 0; i < 10; i++) {
        if (i == 0 || i == 1 || i == 2 || i == 9) continue; // special lessons
        final d = pickDistractors(i, 3);
        expect(d.length, 3, reason: 'lesson ${i + 1} distractor count');
        for (final l in d) {
          expect(['am', 'are', 'is'], contains(l.word.toLowerCase()),
              reason: 'lesson ${i + 1} distractor word');
        }
        final w = writingWordFor(lessons[i], i).toUpperCase();
        expect(['IS', 'ARE', 'AM', 'THE', 'A'], isNot(contains(w)),
            reason: 'lesson ${i + 1} writing word $w');
      }
    });

    test('special lessons 1,2,3,10 use category-appropriate distractors', () {
      for (final i in [0, 1, 2, 9]) {
        final d = pickDistractors(i, 3);
        expect(d.length, 3, reason: 'lesson ${i + 1} distractor count');
        // No dog/flowers/cat in person lessons; no dog/cat in sun lesson.
        for (final l in d) {
          expect(l.imageFile, isNot('q2'), reason: 'lesson ${i + 1} has dog image');
          expect(l.imageFile, isNot('q3'), reason: 'lesson ${i + 1} has flowers image');
          expect(l.imageFile, isNot('q6'), reason: 'lesson ${i + 1} has cat image');
        }
      }
    });

    test('lesson 10 writing word is SUN (not IS)', () {
      expect(writingWordFor(lessons[9], 9), 'SUN');
    });

    test('lesson 39 has five coloring pages with the requested prompts', () {
      final grapes = lessons[38];
      final pages = coloringPagesFor(grapes, 38);
      expect(pages.length, 5);
      expect(pages.take(3).toList(), [31, 32, 43]);

      expect(coloringPromptEn(grapes, 38, 0), 'Color the Grapes');
      expect(coloringPromptEn(grapes, 38, 1),
          'Color the Grapes that are purple');
      expect(coloringPromptEn(grapes, 38, 2),
          'Color the Grapes that are green');
      expect(coloringPromptEn(grapes, 38, 3),
          'Tom says: I like Grapes. Color what Tom said');
      expect(coloringPromptEn(grapes, 38, 4), 'Color as you like!');

      expect(coloringPromptAr(grapes, 0), 'لوّن الصورة');
      expect(coloringPromptAr(grapes, 1), 'لوّنها باللون البنفسجي');
      expect(coloringPromptAr(grapes, 2), 'لوّنها باللون الأخضر');
      expect(coloringPromptAr(grapes, 3), 'لوّن ما قاله توم');
      expect(coloringPromptAr(grapes, 4), 'لوّن كما تحب!');
    });

    test('every one of the first 100 lessons has 5 coloring pages', () {
      for (var i = 0; i < 100; i++) {
        final pages = coloringPagesFor(lessons[i], i);
        expect(pages.length, 5, reason: 'lesson ${i + 1}');
        for (final p in pages) {
          expect(p, inInclusiveRange(1, 100),
              reason: 'lesson ${i + 1} page $p');
        }
      }
    });

    testWidgets('smart choose renders the lesson 39 question', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final grapes = lessons[38];
      final distractors = pickDistractors(38, 3);
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SmartChooseStep(
            lesson: grapes,
            lessonIndex: 38,
            distractors: distractors,
            onComplete: (_) {},
          ),
        ),
      ));
      await tester.pump();
      expect(find.text('Which fruit is NOT Grapes?'), findsOneWidget);
    });

    testWidgets('coloring renders the grapes prompt', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final grapes = lessons[38];
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: ColoringStep(
            lesson: grapes,
            lessonIndex: 38,
            page: 0,
            onPageDone: () {},
          ),
        ),
      ));
      await tester.pump();
      expect(find.text('Color the Grapes'), findsOneWidget);
      expect(find.text('الصورة 1 من 5'), findsOneWidget);
    });
  });
}
