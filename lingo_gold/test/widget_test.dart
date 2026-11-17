// Smoke tests for the 100-lesson Lingo Gold app.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:lingo_gold/course.dart';
import 'package:lingo_gold/main.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('curriculum contains exactly 100 lessons', () {
    expect(courseLessons.length, 100);
    expect(courseSections.length, 8);
    for (var i = 0; i < 100; i++) {
      expect(courseLessons[i].id, i + 1);
    }
  });

  testWidgets('home screen renders the current lesson and start button',
      (tester) async {
    tester.view.physicalSize = const Size(1000, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    expect(find.text('Lingo Gold'), findsOneWidget);
    expect(find.text('الدرس رقم 1'), findsOneWidget);
    expect(find.text('ابدأ الدرس'), findsOneWidget);
    expect(find.text('الرئيسية'), findsOneWidget);
    expect(find.text('ملفي'), findsOneWidget);
  });

  testWidgets('bottom navigation opens Profile', (tester) async {
    tester.view.physicalSize = const Size(1000, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('ملفي'));
    await tester.pumpAndSettle();
    expect(find.text('الشارات'), findsOneWidget);
  });
}
