import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/lesson_flow.dart';

void main() {
  testWidgets('lesson flow shows listening window and checks an answer',
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

    expect(find.text('الدرس 1 من 100'), findsOneWidget);
    expect(find.text('اسمع'), findsOneWidget);
    expect(find.text('اختر إجابة'), findsOneWidget);

    // The correct answer for lesson 1 is "Hello".
    await tester.tap(find.text('Hello'));
    await tester.pump();
    expect(find.text('تحقق'), findsOneWidget);

    await tester.tap(find.text('تحقق'));
    await tester.pump();
    expect(find.text('إجابة صحيحة! 🎉'), findsOneWidget);
    expect(find.text('التالي'), findsOneWidget);
  });
}
