import 'package:flutter/material.dart';

// The six colors used by the guided lesson coloring. They intentionally match
// the free-coloring palette so the learner meets the same colors everywhere.
const Color kColoringRed = Color(0xFFE53935);
const Color kColoringBlue = Color(0xFF1E88E5);
const Color kColoringGreen = Color(0xFF43A047);
const Color kColoringYellow = Color(0xFFFDD835);
const Color kColoringOrange = Color(0xFFFB8C00);
const Color kColoringPink = Color(0xFFD81B60);

/// One guided instruction such as "Color the ball red."
///
/// [x] and [y] are normalized (0..1) coordinates of a white point inside the
/// part that should be colored. They are used to draw the target ring and to
/// decide whether the learner tapped the requested part.
class LessonColoringTask {
  final String label;
  final Color color;
  final String colorName;
  final double x;
  final double y;

  /// Additional white points that belong to the same part (for example the
  /// second leg of a pair of shorts). They are filled together with the main
  /// target when the learner completes the instruction.
  final List<Offset> extraPoints;

  const LessonColoringTask({
    required this.label,
    required this.color,
    required this.colorName,
    required this.x,
    required this.y,
    this.extraPoints = const [],
  });

  String get instruction => 'Color the $label ${colorName.toLowerCase()}.';
  Offset get target => Offset(x, y);
}

/// A lesson coloring page from the project's line-art collection plus the
/// short guided sequence for that lesson.
class LessonColoringData {
  final String asset;
  final List<LessonColoringTask> tasks;
  final String titleEn;

  const LessonColoringData({
    required this.asset,
    required this.tasks,
    required this.titleEn,
  });
}

// The first ten lessons use the same professional line-art pages that are
// already shipped in assets/coloring. Each task points at a white area inside
// the requested part; the bitmap flood fill colors that whole area.

const _lesson1 = LessonColoringData(
  asset: 'assets/coloring/coloring_002.jpg',
  titleEn: 'A boy',
  tasks: [
    LessonColoringTask(
      label: "boy's shirt",
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.50,
      y: 0.62,
    ),
    LessonColoringTask(
      label: 'shorts',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.50,
      y: 0.78,
      extraPoints: [Offset(0.42, 0.78)],
    ),
    LessonColoringTask(
      label: 'shoes',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.42,
      y: 0.93,
      extraPoints: [Offset(0.58, 0.93)],
    ),
  ],
);

const _lesson2 = LessonColoringData(
  asset: 'assets/coloring/coloring_007.jpg',
  titleEn: 'A girl',
  tasks: [
    LessonColoringTask(
      label: "girl's hair",
      color: kColoringYellow,
      colorName: 'Yellow',
      x: 0.45,
      y: 0.25,
    ),
    LessonColoringTask(
      label: 'book',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.50,
      y: 0.65,
    ),
    LessonColoringTask(
      label: 'dress',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.55,
      y: 0.85,
    ),
  ],
);

const _lesson3 = LessonColoringData(
  asset: 'assets/coloring/coloring_001.jpg',
  titleEn: 'A cat',
  tasks: [
    LessonColoringTask(
      label: 'cat',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.50,
      y: 0.50,
    ),
    LessonColoringTask(
      label: 'paw',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.35,
      y: 0.63,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson4 = LessonColoringData(
  asset: 'assets/coloring/coloring_056.jpg',
  titleEn: 'The boy is eating',
  tasks: [
    LessonColoringTask(
      label: 'apple',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.40,
      y: 0.45,
    ),
    LessonColoringTask(
      label: 'shirt',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.55,
      y: 0.62,
    ),
    LessonColoringTask(
      label: 'shorts',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.55,
      y: 0.80,
      extraPoints: [Offset(0.45, 0.80)],
    ),
  ],
);

const _lesson5 = LessonColoringData(
  asset: 'assets/coloring/coloring_082.jpg',
  titleEn: 'The boy is drinking',
  tasks: [
    LessonColoringTask(
      label: 'cup',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.32,
      y: 0.62,
    ),
    LessonColoringTask(
      label: 'shirt',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.60,
      y: 0.62,
    ),
    LessonColoringTask(
      label: 'shorts',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.58,
      y: 0.82,
      extraPoints: [Offset(0.42, 0.82)],
    ),
  ],
);

const _lesson6 = LessonColoringData(
  asset: 'assets/coloring/coloring_048.jpg',
  titleEn: 'A big dog',
  tasks: [
    LessonColoringTask(
      label: 'dog',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.55,
      y: 0.55,
    ),
    LessonColoringTask(
      label: "dog's head",
      color: kColoringRed,
      colorName: 'Red',
      x: 0.42,
      y: 0.30,
    ),
    LessonColoringTask(
      label: 'collar',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.40,
      y: 0.61,
    ),
  ],
);

const _lesson7 = LessonColoringData(
  asset: 'assets/coloring/coloring_037.jpg',
  titleEn: 'A red apple',
  tasks: [
    LessonColoringTask(
      label: 'apple',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.50,
      y: 0.55,
    ),
    LessonColoringTask(
      label: 'leaf',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.64,
      y: 0.16,
    ),
    LessonColoringTask(
      label: 'stem',
      color: kColoringYellow,
      colorName: 'Yellow',
      x: 0.48,
      y: 0.13,
    ),
  ],
);

const _lesson8 = LessonColoringData(
  asset: 'assets/coloring/coloring_086.jpg',
  titleEn: 'The boy and the girl',
  tasks: [
    LessonColoringTask(
      label: "girl's clothes",
      color: kColoringRed,
      colorName: 'Red',
      x: 0.33,
      y: 0.70,
      extraPoints: [Offset(0.33, 0.82)],
    ),
    LessonColoringTask(
      label: "boy's shirt",
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.65,
      y: 0.68,
    ),
    LessonColoringTask(
      label: 'speech bubble',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.15,
      y: 0.10,
    ),
  ],
);

const _lesson9 = LessonColoringData(
  asset: 'assets/coloring/coloring_030.jpg',
  titleEn: 'I am eating',
  tasks: [
    LessonColoringTask(
      label: "boy's shirt",
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.50,
      y: 0.60,
    ),
    LessonColoringTask(
      label: 'grapes',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.38,
      y: 0.42,
    ),
    LessonColoringTask(
      label: 'shorts',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.58,
      y: 0.70,
      extraPoints: [Offset(0.42, 0.72)],
    ),
  ],
);

const _lesson10 = LessonColoringData(
  asset: 'assets/coloring/coloring_093.jpg',
  titleEn: 'The sun',
  tasks: [
    LessonColoringTask(
      label: 'sun',
      color: kColoringYellow,
      colorName: 'Yellow',
      x: 0.50,
      y: 0.50,
    ),
    LessonColoringTask(
      label: 'ray',
      color: kColoringOrange,
      colorName: 'Orange',
      x: 0.50,
      y: 0.18,
    ),
    LessonColoringTask(
      label: 'sky',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson11 = LessonColoringData(
  asset: 'assets/coloring/coloring_009.jpg',
  titleEn: 'Boy',
  tasks: [
    LessonColoringTask(
      label: 'boy',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.521,
      y: 0.303,
    ),
    LessonColoringTask(
      label: 'legs',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.556,
      y: 0.584,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson12 = LessonColoringData(
  asset: 'assets/coloring/coloring_011.jpg',
  titleEn: 'Girl',
  tasks: [
    LessonColoringTask(
      label: 'girl',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.502,
      y: 0.291,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.486,
      y: 0.134,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson13 = LessonColoringData(
  asset: 'assets/coloring/coloring_096.jpg',
  titleEn: 'Father',
  tasks: [
    LessonColoringTask(
      label: 'father',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.286,
      y: 0.633,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.691,
      y: 0.382,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson14 = LessonColoringData(
  asset: 'assets/coloring/coloring_054.jpg',
  titleEn: 'Mother',
  tasks: [
    LessonColoringTask(
      label: 'mother',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.420,
      y: 0.754,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.446,
      y: 0.347,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson15 = LessonColoringData(
  asset: 'assets/coloring/coloring_025.jpg',
  titleEn: 'Baby',
  tasks: [
    LessonColoringTask(
      label: 'baby',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.526,
      y: 0.284,
    ),
    LessonColoringTask(
      label: 'body',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.583,
      y: 0.645,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson16 = LessonColoringData(
  asset: 'assets/coloring/coloring_097.jpg',
  titleEn: 'Grandfather',
  tasks: [
    LessonColoringTask(
      label: 'grandfather',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.331,
      y: 0.532,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.353,
      y: 0.271,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson17 = LessonColoringData(
  asset: 'assets/coloring/coloring_051.jpg',
  titleEn: 'Grandmother',
  tasks: [
    LessonColoringTask(
      label: 'grandmother',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.338,
      y: 0.665,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.287,
      y: 0.163,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson18 = LessonColoringData(
  asset: 'assets/coloring/coloring_046.jpg',
  titleEn: 'Family',
  tasks: [
    LessonColoringTask(
      label: 'family',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.250,
      y: 0.693,
    ),
    LessonColoringTask(
      label: 'person',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.750,
      y: 0.591,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson19 = LessonColoringData(
  asset: 'assets/coloring/coloring_003.jpg',
  titleEn: 'Man',
  tasks: [
    LessonColoringTask(
      label: 'man',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.345,
      y: 0.693,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.394,
      y: 0.297,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

const _lesson20 = LessonColoringData(
  asset: 'assets/coloring/coloring_022.jpg',
  titleEn: 'Woman',
  tasks: [
    LessonColoringTask(
      label: 'woman',
      color: kColoringBlue,
      colorName: 'Blue',
      x: 0.501,
      y: 0.770,
    ),
    LessonColoringTask(
      label: 'head',
      color: kColoringRed,
      colorName: 'Red',
      x: 0.746,
      y: 0.398,
    ),
    LessonColoringTask(
      label: 'background',
      color: kColoringGreen,
      colorName: 'Green',
      x: 0.05,
      y: 0.05,
    ),
  ],
);

/// Returns the guided coloring page for lessons 1–20 (indices 0–19).
LessonColoringData lessonColoringDataFor(int lessonIndex) {
  switch (lessonIndex) {
    case 0:
      return _lesson1;
    case 1:
      return _lesson2;
    case 2:
      return _lesson3;
    case 3:
      return _lesson4;
    case 4:
      return _lesson5;
    case 5:
      return _lesson6;
    case 6:
      return _lesson7;
    case 7:
      return _lesson8;
    case 8:
      return _lesson9;
    case 9:
      return _lesson10;
    case 10:
      return _lesson11;
    case 11:
      return _lesson12;
    case 12:
      return _lesson13;
    case 13:
      return _lesson14;
    case 14:
      return _lesson15;
    case 15:
      return _lesson16;
    case 16:
      return _lesson17;
    case 17:
      return _lesson18;
    case 18:
      return _lesson19;
    default:
      return _lesson20;
  }
}
