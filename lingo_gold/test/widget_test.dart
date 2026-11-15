// Basic smoke tests for تعلم / Lingo Gold.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:lingo_gold/data.dart';
import 'package:lingo_gold/main.dart';

void main() {
  test('lessons list contains exactly 90 lessons', () {
    expect(lessons.length, 90);
    expect(lessons.take(10).every((lesson) => !lesson.isPack), isTrue);
    expect(lessons.skip(10).every((lesson) => lesson.isPack), isTrue);
  });

  testWidgets('home screen renders the new dashboard', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    expect(find.text('Lingo Gold'), findsOneWidget);
    expect(find.text('تعلم'), findsWidgets);
    expect(find.text('أهلاً سارة 👋'), findsOneWidget);
    expect(find.text('هدف اليوم'), findsOneWidget);
    expect(find.text('متابعة التعلم'), findsOneWidget);
    expect(find.text('تقدمك هذا الأسبوع'), findsOneWidget);
    expect(find.text('تحدي اليوم'), findsOneWidget);
    expect(find.text('التصنيفات'), findsOneWidget);
    expect(find.text('التحية'), findsOneWidget);
    expect(find.text('الحيوانات'), findsOneWidget);
    expect(find.text('الطعام'), findsOneWidget);
    expect(find.text('الألوان'), findsOneWidget);
    expect(find.text('الأرقام'), findsOneWidget);
    expect(find.text('العائلة'), findsOneWidget);
    expect(find.text('الرئيسية'), findsOneWidget);
    expect(find.text('تعلم'), findsWidgets);
    expect(find.text('تحدث'), findsOneWidget);
    expect(find.text('الملف'), findsOneWidget);
  });

  testWidgets('bottom navigation opens Learn, Speak and Profile', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const LingoGoldApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('تعلم').last);
    await tester.pumpAndSettle();
    expect(find.text('مسار التعلم الخاص بك'), findsOneWidget);
    expect(find.text('الوحدات'), findsOneWidget);
    expect(find.text('Verb To Be'), findsOneWidget);

    await tester.tap(find.text('تحدث'));
    await tester.pumpAndSettle();
    expect(find.text('تحدث بثقة'), findsOneWidget);
    expect(find.text('دروس التحدث'), findsOneWidget);

    await tester.tap(find.text('الملف'));
    await tester.pumpAndSettle();
    expect(find.text('Sara'), findsOneWidget);
    expect(find.text('الشارات'), findsOneWidget);
    expect(find.text('النشاط الأسبوعي'), findsOneWidget);
  });
}
