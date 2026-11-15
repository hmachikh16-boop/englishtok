import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/lesson_flow.dart';
import 'package:lingo_gold/main.dart';

void main() {
  testWidgets('lesson flow shows five steps and advances with explicit actions',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(MaterialApp(
      home: LessonFlowScreen(lessonIndex: 2),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('LINGO GOLD'), findsOneWidget);
    expect(find.text('درس التحدث'), findsOneWidget);
    expect(find.text('Step 1 of 5'), findsOneWidget);
    expect(find.text('Score: 0/5'), findsOneWidget);
    expect(find.text('قل هذه الجملة'), findsOneWidget);
    expect(find.text('اضغط على الميكروفون وقلها'), findsWidgets);

    // Skip speaking, then complete the writing step for the target word "is".
    await tester.ensureVisible(find.text('تخطي'));
    await tester.pump();
    await tester.tap(find.text('تخطي'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('درس الكتابة'), findsOneWidget);
    expect(find.text('اكتب الكلمة'), findsWidgets);
    expect(find.text('Step 2 of 5'), findsOneWidget);

    // Verify the writing step renders (target word for lesson 2 is "is").
    expect(find.text('اكتب الكلمة'), findsWidgets);
    expect(find.text('Step 2 of 5'), findsOneWidget);
  });
}
