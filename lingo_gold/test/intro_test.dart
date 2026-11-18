import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/data.dart';
import 'package:lingo_gold/lesson_flow.dart';

void main() {
  test('every lesson 1–10 has a unique intro starting with its target', () {
    for (var i = 0; i < 20; i++) {
      final items = introItemsFor(i);
      expect(items, isNotEmpty, reason: 'lesson ${i + 1}');
      expect(items.first.imageFile, lessons[i].imageFile,
          reason: 'lesson ${i + 1} target first');
      expect(
        items.map((e) => e.imageFile).toSet().length,
        items.length,
        reason: 'lesson ${i + 1} duplicate images',
      );
    }
  });

  test('lesson 5 intro teaches the target and all exercise images', () {
    final items = introItemsFor(4);
    expect(
      items.map((e) => e.imageFile).toList(),
      ['n19', 'n18', 'n15', 'n20'],
    );
    expect(items.first.sentence, 'The boy is drinking.');
    expect(
      items.map((e) => e.word).toList(),
      [
        'The boy is drinking',
        'The boy is eating',
        'The boy is running',
        'The boy is sleeping',
      ],
    );
  });

  test('lesson 6 intro includes the elephant and the small dog', () {
    final items = introItemsFor(5);
    expect(
      items.map((e) => e.imageFile).toList(),
      ['q2', 'n47', 'n41', 'q6', 'n45'],
    );
    expect(
      items.firstWhere((e) => e.imageFile == 'n41').word,
      'A small dog',
    );
    expect(items.firstWhere((e) => e.imageFile == 'n45').word, 'Elephant');
  });

  test('lesson 7 intro includes colors and fruit images', () {
    final items = introItemsFor(6);
    expect(
      items.map((e) => e.imageFile).toList(),
      ['q4', 'n22', 'n27', 'n29', 'color_green', 'color_yellow', 'n37'],
    );
    expect(items.first.sentence, 'A red apple.');
    expect(items.firstWhere((e) => e.imageFile == 'color_green').word, 'Green');
    expect(items.firstWhere((e) => e.imageFile == 'n37').word, 'Oranges');
  });

  testWidgets('lesson 1 starts with the learning intro, then listening',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(
      home: LessonFlowScreen(startLessonId: 1, totalLessons: 100),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('مقدمة الدرس'), findsOneWidget);
    expect(find.text('تعلّم الكلمات'), findsOneWidget);
    expect(find.text('مقدمة'), findsOneWidget);
    expect(find.text('A boy.'), findsOneWidget);
    expect(find.text('1 / 4'), findsOneWidget);
    expect(find.text('التالي'), findsOneWidget);

    await tester.tap(find.text('التالي'));
    await tester.pump();

    expect(find.text('A girl'), findsOneWidget);
    expect(find.text('2 / 4'), findsOneWidget);

    await tester.tap(find.text('تخطي المقدمة'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('درس الاستماع'), findsOneWidget);
    expect(find.text('السؤال 1 من 5'), findsOneWidget);
    expect(find.text('استمع بعناية'), findsOneWidget);
  });

  testWidgets('lesson 1 intro reaches the start button after all images',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(
      home: LessonFlowScreen(startLessonId: 1, totalLessons: 100),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    for (var i = 0; i < 3; i++) {
      await tester.tap(find.text('التالي'));
      await tester.pump();
    }

    expect(find.text('4 / 4'), findsOneWidget);
    expect(find.text('ابدأ التمارين'), findsOneWidget);

    await tester.tap(find.text('ابدأ التمارين'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('درس الاستماع'), findsOneWidget);
    expect(find.text('السؤال 1 من 5'), findsOneWidget);
  });
}
