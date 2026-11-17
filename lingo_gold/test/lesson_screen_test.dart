import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/lesson_flow.dart';

void main() {
  testWidgets('lesson flow starts with the listening window', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const MaterialApp(
      home: LessonFlowScreen(startLessonId: 39, totalLessons: 100),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 200));

    expect(find.text('درس الاستماع'), findsOneWidget);
    expect(find.text('السؤال 1 من 5'), findsOneWidget);
    expect(find.text('الدرس 39 • الطعام'), findsOneWidget);
    expect(find.text('استمع بعناية'), findsOneWidget);
    expect(find.text('أي صورة تطابق ما سمعته؟'), findsOneWidget);
  });
}
