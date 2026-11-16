// Basic smoke tests for تعلم / Lingo Gold.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/data.dart';
import 'package:lingo_gold/main.dart';

void main() {
  test('lessons list contains exactly 140 lessons', () {
    expect(lessons.length, 140);
    expect(lessons.take(10).every((lesson) => !lesson.isPack), isTrue);
    expect(lessons.skip(10).take(80).every((lesson) => lesson.isPack), isTrue);
  });

  testWidgets('home screen renders the new dashboard', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    expect(find.text('مستوى مبتدئ'), findsOneWidget);
    expect(find.text('تقدمك 0%'), findsOneWidget);
    expect(find.text('أكمل الدرس الأول لفتح الدرس التالي!'), findsOneWidget);
    expect(find.text('Greeting - التحية'), findsOneWidget);
    expect(find.text('الرئيسية'), findsOneWidget);
    expect(find.text('حياتي'), findsOneWidget);
    expect(find.text('التمارين'), findsOneWidget);
    expect(find.text('ملفي'), findsOneWidget);
  });

  testWidgets('bottom navigation opens Learn, Speak and Profile', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('حياتي').last, warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.text('مسار التعلم الخاص بك'), findsOneWidget);
    expect(find.text('الوحدات'), findsOneWidget);
    expect(find.text('فعل الكينونة'), findsOneWidget);

    await tester.tap(find.text('التمارين'));
    await tester.pumpAndSettle();
    expect(find.text('تحدث بثقة'), findsOneWidget);
    expect(find.text('دروس التحدث'), findsOneWidget);

    await tester.tap(find.text('ملفي'));
    await tester.pumpAndSettle();
    expect(find.text('...'), findsOneWidget);
    expect(find.text('الشارات'), findsOneWidget);
    expect(find.text('النشاط الأسبوعي'), findsOneWidget);
  });
}
