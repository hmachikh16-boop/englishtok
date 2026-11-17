import 'package:flutter/material.dart';

import 'coloring_screen.dart';
import 'data.dart';

/// 5 black-line coloring pages per lesson.
///
/// The first 100 lessons are the ones exposed in the app. Each entry points to
/// one of the 100 line-art pages in assets/coloring.
const Map<String, List<int>> _coloringPages = {
  // Grammar
  'am': [39, 60, 69, 7, 62],
  'are': [39, 60, 69, 7, 62],
  'is': [39, 60, 69, 7, 62],
  // Family
  'boy': [2, 9, 35, 40, 55],
  'girl': [7, 11, 12, 15, 51],
  'father': [96, 97, 54, 46, 53],
  'mother': [54, 34, 25, 85, 53],
  'baby': [25, 29, 53, 85, 88],
  'grandfather': [96, 46, 22, 51, 97],
  'grandmother': [22, 51, 52, 66, 46],
  'family': [46, 54, 96, 97, 51],
  'man': [96, 54, 46, 97, 2],
  'woman': [54, 22, 51, 97, 46],
  // People & actions
  'daughter': [51, 7, 11, 15, 97],
  'happy': [30, 55, 86, 30, 60],
  'sad': [67, 33, 95, 25, 85],
  'hello': [2, 55, 86, 40, 41],
  'run': [12, 35, 9, 89, 86],
  'jump': [9, 26, 89, 12, 35],
  'play': [9, 26, 81, 88, 89],
  'eat': [11, 56, 82, 83, 5],
  'drink': [82, 14, 8, 5, 37],
  'sleep': [33, 67, 95, 29, 85],
  // Food
  'apple': [37, 76, 80, 98, 5],
  'banana': [23, 27, 75, 94, 5],
  'bread': [37, 56, 83, 5, 80],
  'milk': [8, 38, 44, 82, 5],
  'egg': [37, 56, 83, 5, 80],
  'cheese': [37, 56, 83, 5, 80],
  'orange': [4, 10, 68, 78, 79],
  'strawberry': [37, 76, 80, 98, 5],
  'grapes': [31, 32, 43, 31, 49],
  'cookie': [37, 56, 83, 5, 80],
  // Food & more
  'ice cream': [14, 82, 56, 83, 5],
  'juice': [14, 8, 82, 4, 68],
  'cake': [37, 56, 83, 5, 80],
  'lemon': [4, 10, 68, 78, 79],
  'cup': [14, 8, 82, 5, 37],
  'kitchen': [34, 83, 65, 21, 54],
  'oranges': [4, 10, 68, 78, 79],
  'strawberries': [37, 76, 80, 98, 5],
  'apples': [37, 76, 80, 98, 5],
  'red': [4, 37, 98, 80, 5],
  // Animals
  'dog': [16, 48, 71, 77, 99],
  'cat': [1, 65, 81, 84, 90],
  'bird': [28, 92, 58, 93, 6],
  'fish': [47, 58, 92, 93, 28],
  'elephant': [13, 20, 26, 59, 87],
  'turtle': [13, 20, 26, 59, 87],
  'rabbit': [16, 48, 71, 77, 99],
  'leopard': [13, 20, 26, 59, 87],
  'kitten': [1, 65, 81, 84, 90],
  'black cat': [1, 65, 81, 84, 90],
  // Home & nature
  'house': [21, 46, 44, 30, 54],
  'door': [21, 46, 54, 30, 97],
  'window': [21, 6, 28, 58, 46],
  'chair': [60, 69, 63, 64, 7],
  'tree': [30, 44, 46, 21, 28],
  'sky': [58, 28, 92, 93, 6],
  'moon': [19, 45, 50, 6, 29],
  'star': [50, 19, 45, 6, 28],
  'rose': [30, 98, 80, 37, 5],
  'sunflower': [30, 28, 93, 92, 6],
  // Fun & school
  'snowman': [58, 28, 92, 93, 47],
  'rainbow': [92, 28, 93, 58, 47],
  'balloons': [9, 88, 86, 60, 89],
  'balloon': [9, 88, 86, 60, 89],
  'water': [47, 58, 92, 93, 28],
  'ball': [9, 26, 81, 88, 89],
  'pencils': [63, 64, 60, 69, 7],
  'pen': [63, 64, 60, 69, 7],
  'book': [7, 60, 62, 63, 69],
  'car': [17, 100, 16, 48, 99],
  // Greetings
  'wave': [2, 55, 86, 40, 41],
  'goodbye': [2, 55, 86, 40, 41],
  'raise hand': [2, 55, 86, 60, 69],
  'dinner': [11, 56, 82, 83, 5],
  'goodnight': [33, 67, 95, 29, 85],
  'talk': [86, 60, 69, 55, 2],
  'gift': [41, 97, 86, 2, 55],
  'welcome': [2, 55, 86, 40, 41],
  'wake up': [40, 28, 6, 2, 55],
  'shake hands': [2, 55, 86, 41, 97],
  // Jobs
  'doctor': [24, 42, 61, 70, 72],
  'nurse': [42, 57, 72, 24, 61],
  'pilot': [28, 92, 93, 58, 100],
  'firefighter': [17, 36, 18, 3, 73],
  'chef': [34, 83, 56, 65, 37],
  'teacher': [39, 63, 64, 60, 69],
  'police officer': [3, 18, 36, 17, 73],
  'farmer': [44, 38, 46, 48, 99],
  'baker': [37, 56, 83, 5, 80],
  'student': [7, 60, 62, 63, 69],
};

const List<List<int>> _fallbackPages = [
  [39, 60, 69, 7, 62],
  [46, 54, 96, 97, 51],
  [30, 55, 86, 60, 89],
  [37, 76, 80, 98, 5],
  [37, 56, 83, 5, 80],
  [13, 20, 26, 59, 87],
  [21, 46, 44, 30, 54],
  [9, 26, 81, 88, 89],
  [2, 55, 86, 40, 41],
  [24, 42, 61, 70, 72],
];

List<int> coloringPagesFor(Lesson lesson, int lessonIndex) {
  final pages = _coloringPages[lesson.word.toLowerCase()];
  if (pages != null && pages.length >= 5) return pages;
  final group = (lessonIndex ~/ 10).clamp(0, _fallbackPages.length - 1);
  return _fallbackPages[group];
}

String coloringPromptEn(Lesson lesson, int lessonIndex, int page) {
  // Special prompts for lessons 1-10.
  if (lessonIndex >= 0 && lessonIndex < 10) {
    const specialPrompts = [
      // Lesson 1: I am / He is / They are
      ['Color I am', 'Color He is', 'Color They are', 'Tom says: I am a boy. Color what Tom said', 'Color as you like!'],
      // Lesson 2: She is / We are / You are
      ['Color She is', 'Color We are', 'Color You are', 'Tom says: She is a girl. Color what Tom said', 'Color as you like!'],
      // Lesson 3: It is / This is / That is
      ['Color It is', 'Color This is', 'Color That is', 'Tom says: It is a cat. Color what Tom said', 'Color as you like!'],
      // Lesson 4: My book / Your book / His book
      ['Color My book', 'Color Your book', 'Color His book', 'Tom says: This is my book. Color what Tom said', 'Color as you like!'],
      // Lesson 5: Big / Small / Tall
      ['Color Big', 'Color Small', 'Color Tall', 'Tom says: The elephant is big. Color what Tom said', 'Color as you like!'],
      // Lesson 6: Red / Blue / Yellow
      ['Color Red', 'Color Blue', 'Color Yellow', 'Tom says: The apple is red. Color what Tom said', 'Color as you like!'],
      // Lesson 7: fast / sleeping / eating
      ['Color fast', 'Color sleeping', 'Color eating', 'Tom says: The cat is fast. Color what Tom said', 'Color as you like!'],
      // Lesson 8: happy / sad / running
      ['Color happy', 'Color sad', 'Color running', 'Tom says: The dog is happy. Color what Tom said', 'Color as you like!'],
      // Lesson 9: Apples / Milk / Bread
      ['Color Apples', 'Color Milk', 'Color Bread', 'Tom says: I like apples. Color what Tom said', 'Color as you like!'],
      // Lesson 10: SUN / MOON / STARS
      ['Color the sun', 'Color the bright sun', 'Color the moon', 'Tom says: The sun is bright. Color what Tom said', 'Color as you like!'],
    ];
    return specialPrompts[lessonIndex][page.clamp(0, 4)];
  }

  final isGrammar = lessonIndex < 10;
  final target = isGrammar ? 'picture' : lesson.word;
  final plural = !isGrammar &&
      (lesson.word.endsWith('s') || lesson.word.endsWith('S'));
  final sentence = lesson.sentence.replaceAll('___', lesson.word);
  switch (page) {
    case 0:
      return 'Color the $target';
    case 1:
      return plural
          ? 'Color the $target that are purple'
          : 'Color the $target purple';
    case 2:
      return plural
          ? 'Color the $target that are green'
          : 'Color the $target green';
    case 3:
      final clean = sentence.endsWith('.') ? sentence : '$sentence.';
      return 'Tom says: $clean Color what Tom said';
    default:
      return 'Color as you like!';
  }
}

String coloringPromptAr(Lesson lesson, int page) {
  switch (page) {
    case 0:
      return 'لوّن الصورة';
    case 1:
      return 'لوّنها باللون البنفسجي';
    case 2:
      return 'لوّنها باللون الأخضر';
    case 3:
      return 'لوّن ما قاله توم';
    default:
      return 'لوّن كما تحب!';
  }
}

class ColoringStep extends StatelessWidget {
  final Lesson lesson;
  final int lessonIndex;
  final int page;
  final VoidCallback onPageDone;

  const ColoringStep({
    super.key,
    required this.lesson,
    required this.lessonIndex,
    required this.page,
    required this.onPageDone,
  });

  @override
  Widget build(BuildContext context) {
    final pages = coloringPagesFor(lesson, lessonIndex);
    final pageNumber = pages[page.clamp(0, pages.length - 1)];
    final asset =
        'assets/coloring/coloring_${pageNumber.toString().padLeft(3, '0')}.jpg';
    return ColoringCanvas(
      imageAsset: asset,
      prompt: coloringPromptEn(lesson, lessonIndex, page),
      promptAr: coloringPromptAr(lesson, page),
      pageLabel: 'الصورة ${page + 1} من 5',
      onDone: onPageDone,
    );
  }
}
