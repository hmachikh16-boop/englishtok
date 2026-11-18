import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/lesson_coloring_pages.dart';
import 'package:lingo_gold/lesson_coloring_step.dart';
import 'package:lingo_gold/theme.dart';

Future<void> _pumpColoring(
  WidgetTester tester,
  int lessonIndex, {
  VoidCallback? onComplete,
}) async {
  await tester.pumpWidget(
    MaterialApp(
      theme: buildAppTheme(),
      home: Scaffold(
        body: LessonColoringStep(
          lessonIndex: lessonIndex,
          onComplete: onComplete ?? () {},
        ),
      ),
    ),
  );
  await tester.pump();
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 1200));
  });
  await tester.pump();
}

Offset _targetPoint(WidgetTester tester, LessonColoringTask task) {
  final canvas = tester.getRect(find.byKey(const ValueKey('coloring-canvas')));
  return canvas.topLeft + Offset(task.x * canvas.width, task.y * canvas.height);
}

Future<void> _settleImage(WidgetTester tester) async {
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
  });
  await tester.pump();
}

void main() {
  group('lesson coloring data', () {
    test('all lessons 1-20 use a project line-art page and three tasks', () {
      for (var lessonIndex = 0; lessonIndex < 20; lessonIndex++) {
        final data = lessonColoringDataFor(lessonIndex);
        expect(data.tasks.length, 3, reason: 'lesson ${lessonIndex + 1}');
        expect(data.titleEn, isNotEmpty);
        expect(
          data.asset,
          startsWith('assets/coloring/coloring_'),
          reason: 'lesson ${lessonIndex + 1}',
        );
        expect(data.asset, endsWith('.jpg'));
        expect(
          File(data.asset).existsSync(),
          isTrue,
          reason: 'missing ${data.asset}',
        );

        for (final task in data.tasks) {
          expect(task.x, greaterThanOrEqualTo(0.0));
          expect(task.x, lessThanOrEqualTo(1.0));
          expect(task.y, greaterThanOrEqualTo(0.0));
          expect(task.y, lessThanOrEqualTo(1.0));
          expect(task.instruction, startsWith('Color the '));
          expect(task.instruction, endsWith('.'));
          expect(task.colorName, isNotEmpty);
        }
      }
    });

    test('lesson 1 uses the project boy page', () {
      final data = lessonColoringDataFor(0);
      expect(data.asset, 'assets/coloring/coloring_002.jpg');
      expect(data.tasks.map((t) => t.label).toList(), [
        "boy's shirt",
        'shorts',
        'shoes',
      ]);
      expect(data.tasks[0].instruction, "Color the boy's shirt blue.");
      expect(data.tasks[1].instruction, 'Color the shorts red.');
      expect(data.tasks[2].instruction, 'Color the shoes green.');
      expect(data.tasks[1].extraPoints.length, 1);
      expect(data.tasks[2].extraPoints.length, 1);
    });

    test('lesson 5 uses the project drinking page', () {
      final data = lessonColoringDataFor(4);
      expect(data.asset, 'assets/coloring/coloring_082.jpg');
      expect(data.tasks.map((t) => t.label).toList(), [
        'cup',
        'shirt',
        'shorts',
      ]);
      expect(data.tasks[0].instruction, 'Color the cup red.');
      expect(data.tasks[1].instruction, 'Color the shirt blue.');
      expect(data.tasks[2].instruction, 'Color the shorts green.');
    });
  });

  testWidgets('guided coloring fills the cup and advances', (tester) async {
    var completed = false;
    await _pumpColoring(tester, 4, onComplete: () => completed = true);

    final data = lessonColoringDataFor(4);
    expect(find.text('Color the cup red.', findRichText: true), findsOneWidget);

    for (final task in data.tasks) {
      await tester.tap(find.byKey(ValueKey('color-${task.colorName}')));
      await tester.pump();
      await tester.tapAt(_targetPoint(tester, task));
      await tester.pump();
      await _settleImage(tester);
    }

    expect(find.text('✅ أحسنت! اكتمل التلوين.'), findsOneWidget);
    expect(completed, isFalse);

    await tester.tap(find.widgetWithText(FilledButton, 'متابعة'));
    await tester.pump();
    expect(completed, isTrue);
  });

  testWidgets('wrong color does not advance the guided task', (tester) async {
    await _pumpColoring(tester, 4);
    final data = lessonColoringDataFor(4);

    await tester.tap(find.byKey(const ValueKey('color-Blue')));
    await tester.pump();
    await tester.tapAt(_targetPoint(tester, data.tasks[0]));
    await tester.pump();
    await _settleImage(tester);

    // Still on the first instruction, but the cup is now blue.
    expect(find.text('Color the cup red.', findRichText: true), findsOneWidget);
  });

  testWidgets('undo restores the previous guided task', (tester) async {
    await _pumpColoring(tester, 4);
    final data = lessonColoringDataFor(4);

    await tester.tap(find.byKey(const ValueKey('color-Red')));
    await tester.pump();
    await tester.tapAt(_targetPoint(tester, data.tasks[0]));
    await tester.pump();
    await _settleImage(tester);
    expect(
      find.text('Color the shirt blue.', findRichText: true),
      findsOneWidget,
    );

    await tester.tap(find.byTooltip('تراجع'));
    await tester.pump();
    await _settleImage(tester);
    expect(find.text('Color the cup red.', findRichText: true), findsOneWidget);
  });
}
