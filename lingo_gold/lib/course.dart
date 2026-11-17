import 'package:flutter/material.dart';

// ============================================================
// LINGO GOLD - 100 LESSON CURRICULUM
// 8 sections, exact order requested by the product owner.
// Each lesson = 6 windows x 3 levels = 18 activities.
// ============================================================

enum ActivityType { listening, choose, writing, smartChoose, matching }
enum Difficulty { beginner, intermediate, advanced }

const List<String> difficultyAr = ['مبتدئ', 'متوسط', 'متقدم'];
const List<String> activityAr = [
  'السمع',
  'الاختيار',
  'الكتابة',
  'الاختيار الذكي',
  'المطابقة',
  'التلوين',
];

class CourseSection {
  final String nameAr;
  final String nameEn;
  final int start;
  final int end;
  const CourseSection(this.nameAr, this.nameEn, this.start, this.end);
}

const List<CourseSection> courseSections = [
  CourseSection('التحية والمشاعر', 'Greetings & Feelings', 1, 10),
  CourseSection('العائلة', 'Family', 11, 20),
  CourseSection('الحيوانات', 'Animals', 21, 35),
  CourseSection('الفواكه والطعام', 'Fruits & Food', 36, 50),
  CourseSection('الأرقام والألوان', 'Numbers & Colors', 51, 60),
  CourseSection('البيت والأشياء', 'Home & Things', 61, 70),
  CourseSection('المهن', 'Jobs', 71, 85),
  CourseSection('الطبيعة والطقس', 'Nature & Weather', 86, 100),
];

class CourseLesson {
  final int id;
  final String word;
  final String translation;
  final String sectionAr;
  final String sectionEn;
  final String emoji;
  final Color? tint;
  final int count;
  const CourseLesson(
    this.id,
    this.word,
    this.translation,
    this.sectionAr,
    this.sectionEn,
    this.emoji, {
    this.tint,
    this.count = 1,
  });
}

const Color kRedTint = Color(0xFFE53935);
const Color kBlueTint = Color(0xFF1E88E5);
const Color kGreenTint = Color(0xFF43A047);
const Color kYellowTint = Color(0xFFFDD835);
const Color kBlackTint = Color(0xFF212121);

const List<CourseLesson> courseLessons = [
  // ===== 1. Greetings & Feelings (1-10) =====
  CourseLesson(1, 'Hello', 'مرحبا', 'التحية والمشاعر', 'Greetings & Feelings', '👋'),
  CourseLesson(2, 'Good Morning', 'صباح الخير', 'التحية والمشاعر', 'Greetings & Feelings', '🌅'),
  CourseLesson(3, 'Thank You', 'شكراً', 'التحية والمشاعر', 'Greetings & Feelings', '🙏'),
  CourseLesson(4, 'Please', 'من فضلك', 'التحية والمشاعر', 'Greetings & Feelings', '🤲'),
  CourseLesson(5, 'Goodbye', 'مع السلامة', 'التحية والمشاعر', 'Greetings & Feelings', '👋'),
  CourseLesson(6, 'How are you?', 'كيف حالك؟', 'التحية والمشاعر', 'Greetings & Feelings', '🤔'),
  CourseLesson(7, 'I am happy', 'أنا سعيد', 'التحية والمشاعر', 'Greetings & Feelings', '😊'),
  CourseLesson(8, 'I am sad', 'أنا حزين', 'التحية والمشاعر', 'Greetings & Feelings', '😢'),
  CourseLesson(9, 'I am tired', 'أنا متعب', 'التحية والمشاعر', 'Greetings & Feelings', '😴'),
  CourseLesson(10, 'Sorry', 'آسف', 'التحية والمشاعر', 'Greetings & Feelings', '😔'),

  // ===== 2. Family (11-20) =====
  CourseLesson(11, 'Mom', 'أمي', 'العائلة', 'Family', '👩'),
  CourseLesson(12, 'Dad', 'أبي', 'العائلة', 'Family', '👨'),
  CourseLesson(13, 'Boy', 'صبي', 'العائلة', 'Family', '👦'),
  CourseLesson(14, 'Girl', 'فتاة', 'العائلة', 'Family', '👧'),
  CourseLesson(15, 'Baby', 'طفل', 'العائلة', 'Family', '👶'),
  CourseLesson(16, 'Grandma', 'جدة', 'العائلة', 'Family', '👵'),
  CourseLesson(17, 'Grandpa', 'جد', 'العائلة', 'Family', '👴'),
  CourseLesson(18, 'Brother', 'أخ', 'العائلة', 'Family', '👦'),
  CourseLesson(19, 'Sister', 'أخت', 'العائلة', 'Family', '👧'),
  CourseLesson(20, 'Family', 'عائلة', 'العائلة', 'Family', '👨‍👩‍👧‍👦'),

  // ===== 3. Animals (21-35) =====
  CourseLesson(21, 'Cat', 'قطة', 'الحيوانات', 'Animals', '🐱'),
  CourseLesson(22, 'Dog', 'كلب', 'الحيوانات', 'Animals', '🐶'),
  CourseLesson(23, 'Lion', 'أسد', 'الحيوانات', 'Animals', '🦁'),
  CourseLesson(24, 'Elephant', 'فيل', 'الحيوانات', 'Animals', '🐘'),
  CourseLesson(25, 'Bird', 'طائر', 'الحيوانات', 'Animals', '🐦'),
  CourseLesson(26, 'Horse', 'حصان', 'الحيوانات', 'Animals', '🐴'),
  CourseLesson(27, 'Cow', 'بقرة', 'الحيوانات', 'Animals', '🐮'),
  CourseLesson(28, 'Chicken', 'دجاجة', 'الحيوانات', 'Animals', '🐔'),
  CourseLesson(29, 'Fish', 'سمكة', 'الحيوانات', 'Animals', '🐟'),
  CourseLesson(30, 'Rabbit', 'أرنب', 'الحيوانات', 'Animals', '🐰'),
  CourseLesson(31, 'Monkey', 'قرد', 'الحيوانات', 'Animals', '🐵'),
  CourseLesson(32, 'Bear', 'دب', 'الحيوانات', 'Animals', '🐻'),
  CourseLesson(33, 'Fox', 'ثعلب', 'الحيوانات', 'Animals', '🦊'),
  CourseLesson(34, 'Duck', 'بطة', 'الحيوانات', 'Animals', '🦆'),
  CourseLesson(35, 'Goat', 'عنزة', 'الحيوانات', 'Animals', '🐐'),

  // ===== 4. Fruits & Food (36-50) =====
  CourseLesson(36, 'Apple', 'تفاحة', 'الفواكه والطعام', 'Fruits & Food', '🍎'),
  CourseLesson(37, 'Banana', 'موزة', 'الفواكه والطعام', 'Fruits & Food', '🍌'),
  CourseLesson(38, 'Orange', 'برتقالة', 'الفواكه والطعام', 'Fruits & Food', '🍊'),
  CourseLesson(39, 'Grapes', 'عنب', 'الفواكه والطعام', 'Fruits & Food', '🍇'),
  CourseLesson(40, 'Strawberry', 'فراولة', 'الفواكه والطعام', 'Fruits & Food', '🍓'),
  CourseLesson(41, 'Lemon', 'ليمون', 'الفواكه والطعام', 'Fruits & Food', '🍋'),
  CourseLesson(42, 'Carrot', 'جزر', 'الفواكه والطعام', 'Fruits & Food', '🥕'),
  CourseLesson(43, 'Bread', 'خبز', 'الفواكه والطعام', 'Fruits & Food', '🍞'),
  CourseLesson(44, 'Milk', 'حليب', 'الفواكه والطعام', 'Fruits & Food', '🥛'),
  CourseLesson(45, 'Egg', 'بيضة', 'الفواكه والطعام', 'Fruits & Food', '🥚'),
  CourseLesson(46, 'Cheese', 'جبن', 'الفواكه والطعام', 'Fruits & Food', '🧀'),
  CourseLesson(47, 'Potato', 'بطاطس', 'الفواكه والطعام', 'Fruits & Food', '🥔'),
  CourseLesson(48, 'Rice', 'أرز', 'الفواكه والطعام', 'Fruits & Food', '🍚'),
  CourseLesson(49, 'Chicken Food', 'دجاج', 'الفواكه والطعام', 'Fruits & Food', '🍗'),
  CourseLesson(50, 'Chocolate', 'شوكولاتة', 'الفواكه والطعام', 'Fruits & Food', '🍫'),

  // ===== 5. Numbers & Colors (51-60) =====
  CourseLesson(51, 'One', 'واحد', 'الأرقام والألوان', 'Numbers & Colors', '🍎', count: 1),
  CourseLesson(52, 'Two', 'اثنان', 'الأرقام والألوان', 'Numbers & Colors', '🍎', count: 2),
  CourseLesson(53, 'Three', 'ثلاثة', 'الأرقام والألوان', 'Numbers & Colors', '🍎', count: 3),
  CourseLesson(54, 'Four', 'أربعة', 'الأرقام والألوان', 'Numbers & Colors', '🍎', count: 4),
  CourseLesson(55, 'Five', 'خمسة', 'الأرقام والألوان', 'Numbers & Colors', '🍎', count: 5),
  CourseLesson(56, 'Red', 'أحمر', 'الأرقام والألوان', 'Numbers & Colors', '⚪', tint: kRedTint),
  CourseLesson(57, 'Blue', 'أزرق', 'الأرقام والألوان', 'Numbers & Colors', '⚪', tint: kBlueTint),
  CourseLesson(58, 'Green', 'أخضر', 'الأرقام والألوان', 'Numbers & Colors', '⚪', tint: kGreenTint),
  CourseLesson(59, 'Yellow', 'أصفر', 'الأرقام والألوان', 'Numbers & Colors', '⚪', tint: kYellowTint),
  CourseLesson(60, 'Black White', 'أسود وأبيض', 'الأرقام والألوان', 'Numbers & Colors', '⚪', tint: kBlackTint),

  // ===== 6. Home & Things (61-70) =====
  CourseLesson(61, 'House', 'بيت', 'البيت والأشياء', 'Home & Things', '🏠'),
  CourseLesson(62, 'Door', 'باب', 'البيت والأشياء', 'Home & Things', '🚪'),
  CourseLesson(63, 'Bed', 'سرير', 'البيت والأشياء', 'Home & Things', '🛏️'),
  CourseLesson(64, 'Chair', 'كرسي', 'البيت والأشياء', 'Home & Things', '🪑'),
  CourseLesson(65, 'Table', 'طاولة', 'البيت والأشياء', 'Home & Things', '🍽️'),
  CourseLesson(66, 'Book', 'كتاب', 'البيت والأشياء', 'Home & Things', '📖'),
  CourseLesson(67, 'Pen', 'قلم', 'البيت والأشياء', 'Home & Things', '🖊️'),
  CourseLesson(68, 'Ball', 'كرة', 'البيت والأشياء', 'Home & Things', '⚽'),
  CourseLesson(69, 'Car', 'سيارة', 'البيت والأشياء', 'Home & Things', '🚗'),
  CourseLesson(70, 'Phone', 'هاتف', 'البيت والأشياء', 'Home & Things', '📱'),

  // ===== 7. Jobs (71-85) =====
  CourseLesson(71, 'Policeman', 'شرطي', 'المهن', 'Jobs', '👮'),
  CourseLesson(72, 'Teacher', 'معلم', 'المهن', 'Jobs', '👩‍🏫'),
  CourseLesson(73, 'Doctor', 'طبيب', 'المهن', 'Jobs', '👨‍⚕️'),
  CourseLesson(74, 'Farmer', 'مزارع', 'المهن', 'Jobs', '👨‍🌾'),
  CourseLesson(75, 'Driver', 'سائق', 'المهن', 'Jobs', '🚗'),
  CourseLesson(76, 'Cook', 'طباخ', 'المهن', 'Jobs', '👨‍🍳'),
  CourseLesson(77, 'Baker', 'خباز', 'المهن', 'Jobs', '🥖'),
  CourseLesson(78, 'Carpenter', 'نجار', 'المهن', 'Jobs', '🔨'),
  CourseLesson(79, 'Painter', 'رسام', 'المهن', 'Jobs', '🎨'),
  CourseLesson(80, 'Nurse', 'ممرضة', 'المهن', 'Jobs', '👩‍⚕️'),
  CourseLesson(81, 'Engineer', 'مهندس', 'المهن', 'Jobs', '👷'),
  CourseLesson(82, 'Soldier', 'جندي', 'المهن', 'Jobs', '💂'),
  CourseLesson(83, 'Seller', 'بائع', 'المهن', 'Jobs', '🛍️'),
  CourseLesson(84, 'Cleaner', 'عامل نظافة', 'المهن', 'Jobs', '🧹'),
  CourseLesson(85, 'Pilot', 'طيار', 'المهن', 'Jobs', '👨‍✈️'),

  // ===== 8. Nature & Weather (86-100) =====
  CourseLesson(86, 'Sun', 'شمس', 'الطبيعة والطقس', 'Nature & Weather', '☀️'),
  CourseLesson(87, 'Moon', 'قمر', 'الطبيعة والطقس', 'Nature & Weather', '🌙'),
  CourseLesson(88, 'Rain', 'مطر', 'الطبيعة والطقس', 'Nature & Weather', '🌧️'),
  CourseLesson(89, 'Snow', 'ثلج', 'الطبيعة والطقس', 'Nature & Weather', '❄️'),
  CourseLesson(90, 'Cloud', 'سحابة', 'الطبيعة والطقس', 'Nature & Weather', '☁️'),
  CourseLesson(91, 'Tree', 'شجرة', 'الطبيعة والطقس', 'Nature & Weather', '🌳'),
  CourseLesson(92, 'Flower', 'زهرة', 'الطبيعة والطقس', 'Nature & Weather', '🌸'),
  CourseLesson(93, 'Sea', 'بحر', 'الطبيعة والطقس', 'Nature & Weather', '🌊'),
  CourseLesson(94, 'Mountain', 'جبل', 'الطبيعة والطقس', 'Nature & Weather', '⛰️'),
  CourseLesson(95, 'River', 'نهر', 'الطبيعة والطقس', 'Nature & Weather', '🏞️'),
  CourseLesson(96, 'Summer', 'صيف', 'الطبيعة والطقس', 'Nature & Weather', '🌞'),
  CourseLesson(97, 'Winter', 'شتاء', 'الطبيعة والطقس', 'Nature & Weather', '❄️'),
  CourseLesson(98, 'Spring', 'ربيع', 'الطبيعة والطقس', 'Nature & Weather', '🌷'),
  CourseLesson(99, 'Autumn', 'خريف', 'الطبيعة والطقس', 'Nature & Weather', '🍂'),
  CourseLesson(100, 'Wind', 'ريح', 'الطبيعة والطقس', 'Nature & Weather', '💨'),
];

CourseLesson lessonById(int id) =>
    courseLessons.firstWhere((l) => l.id == id, orElse: () => courseLessons.first);

CourseSection sectionOf(CourseLesson l) => courseSections.firstWhere(
      (s) => l.id >= s.start && l.id <= s.end,
      orElse: () => courseSections.first,
    );

// ============================================================
// VARIATION HELPERS
// ============================================================

enum VariantKind { word, action, tint, count }

const List<String> _actions = [
  'eating',
  'sleeping',
  'running',
  'laughing',
  'playing',
];
const Map<String, String> _actionEmoji = {
  'eating': '🍽️',
  'sleeping': '😴',
  'running': '🏃',
  'laughing': '😂',
  'playing': '⚽',
};
const List<MapEntry<String, Color>> _tintPalette = [
  MapEntry('red', Color(0xFFE53935)),
  MapEntry('blue', Color(0xFF1E88E5)),
  MapEntry('green', Color(0xFF43A047)),
  MapEntry('yellow', Color(0xFFFDD835)),
  MapEntry('purple', Color(0xFF8E24AA)),
  MapEntry('orange', Color(0xFFFB8C00)),
];
const List<String> _numberWords = ['one', 'two', 'three', 'four', 'five', 'six'];

VariantKind variantKindOf(CourseLesson l) {
  if (l.sectionEn == 'Greetings & Feelings') return VariantKind.word;
  if (l.sectionEn == 'Family' ||
      l.sectionEn == 'Animals' ||
      l.sectionEn == 'Jobs') {
    return VariantKind.action;
  }
  if (l.sectionEn == 'Numbers & Colors') {
    return l.tint != null ? VariantKind.tint : VariantKind.count;
  }
  return VariantKind.tint;
}

String actionOf(CourseLesson l) => _actions[l.id % _actions.length];

String sentenceOf(CourseLesson l) {
  switch (l.sectionEn) {
    case 'Greetings & Feelings':
      return l.word;
    case 'Family':
      return 'This is my ${l.word.toLowerCase()}.';
    case 'Animals':
      return 'This is a ${l.word.toLowerCase()}.';
    case 'Fruits & Food':
      return 'I like ${l.word.toLowerCase()}.';
    case 'Numbers & Colors':
      if (l.tint != null) {
        return 'The ball is ${l.word.toLowerCase()}.';
      }
      return 'I have ${_numberWords[l.count - 1]} '
          '${l.count == 1 ? 'apple' : 'apples'}.';
    case 'Home & Things':
      return 'This is a ${l.word.toLowerCase()}.';
    case 'Jobs':
      return 'He is a ${l.word.toLowerCase()}.';
    default:
      return 'This is the ${l.word.toLowerCase()}.';
  }
}

String tomSentenceOf(CourseLesson l) {
  final kind = variantKindOf(l);
  switch (kind) {
    case VariantKind.action:
      return 'My ${l.word.toLowerCase()} is ${actionOf(l)}.';
    case VariantKind.count:
      return 'I have ${_numberWords[l.count - 1]} '
          '${l.count == 1 ? 'apple' : 'apples'}.';
    case VariantKind.tint:
      return 'My ${l.word.toLowerCase()} is ${_tintName(l)}.';
    case VariantKind.word:
      return l.word;
  }
}

String _tintName(CourseLesson l) {
  if (l.tint != null) {
    for (final e in _tintPalette) {
      if (e.value.value == l.tint!.value) return e.key;
    }
    return l.word.toLowerCase();
  }
  return _tintPalette[l.id % _tintPalette.length].key;
}

Color _tintColor(CourseLesson l) {
  if (l.tint != null) return l.tint!;
  return _tintPalette[l.id % _tintPalette.length].value;
}

// ============================================================
// ACTIVITY MODEL
// ============================================================

class ActivityOption {
  final String emoji;
  final String label;
  final Color? tint;
  final String? badge;
  final int count;
  final bool isCorrect;
  const ActivityOption({
    required this.emoji,
    required this.label,
    this.tint,
    this.badge,
    this.count = 1,
    this.isCorrect = false,
  });
}

class MatchPair {
  final String left;
  final String emoji;
  final String label;
  final Color? tint;
  final String? badge;
  final int count;
  const MatchPair({
    required this.left,
    required this.emoji,
    required this.label,
    this.tint,
    this.badge,
    this.count = 1,
  });
}

class Activity {
  final ActivityType type;
  final Difficulty difficulty;
  final String instructionAr;
  final String questionEn;
  final List<ActivityOption> options;
  final String? speakText;
  final String? tomText;
  final List<MatchPair>? pairs;
  final String? blankSentence;
  final String? answerWord;
  const Activity({
    required this.type,
    required this.difficulty,
    required this.instructionAr,
    required this.questionEn,
    this.options = const [],
    this.speakText,
    this.tomText,
    this.pairs,
    this.blankSentence,
    this.answerWord,
  });
}

// ============================================================
// ACTIVITY BUILDER
// ============================================================

List<CourseLesson> _sectionPeers(CourseLesson l) {
  final s = sectionOf(l);
  return courseLessons
      .where((x) => x.id >= s.start && x.id <= s.end && x.id != l.id)
      .toList();
}

List<CourseLesson> _otherSectionLessons(CourseLesson l) {
  final s = sectionOf(l);
  return courseLessons.where((x) => x.id < s.start || x.id > s.end).toList();
}

ActivityOption _wordOption(CourseLesson l, {required bool correct}) =>
    ActivityOption(
      emoji: l.emoji,
      label: l.word,
      tint: l.tint,
      count: l.count,
      isCorrect: correct,
    );

List<ActivityOption> _beginnerOptions(CourseLesson lesson) {
  final peers = _sectionPeers(lesson)..shuffle();
  final picked = <CourseLesson>[];
  for (final p in peers) {
    if (picked.length >= 3) break;
    if (p.emoji == lesson.emoji) continue;
    if (picked.any((e) => e.emoji == p.emoji)) continue;
    picked.add(p);
  }
  while (picked.length < 3) {
    final extra = _otherSectionLessons(lesson);
    extra.shuffle();
    for (final e in extra) {
      if (picked.length >= 3) break;
      if (e.emoji == lesson.emoji) continue;
      if (picked.any((x) => x.emoji == e.emoji)) continue;
      picked.add(e);
    }
  }
  final opts = <ActivityOption>[
    _wordOption(lesson, correct: true),
    for (final p in picked) _wordOption(p, correct: false),
  ]..shuffle();
  return opts;
}

List<ActivityOption> _variantOptions(CourseLesson lesson) {
  final kind = variantKindOf(lesson);
  if (kind == VariantKind.word) return _beginnerOptions(lesson);

  if (kind == VariantKind.action) {
    final correct = actionOf(lesson);
    final actions = <String>[correct];
    for (final a in _actions) {
      if (actions.length >= 4) break;
      if (!actions.contains(a)) actions.add(a);
    }
    final opts = [
      for (final a in actions)
        ActivityOption(
          emoji: lesson.emoji,
          label: a,
          badge: _actionEmoji[a],
          isCorrect: a == correct,
        ),
    ]..shuffle();
    return opts;
  }

  if (kind == VariantKind.count) {
    final counts = <int>[lesson.count];
    var c = 1;
    while (counts.length < 4) {
      if (!counts.contains(c)) counts.add(c);
      c++;
    }
    final opts = [
      for (final n in counts)
        ActivityOption(
          emoji: lesson.emoji,
          label: '$n',
          count: n,
          isCorrect: n == lesson.count,
        ),
    ]..shuffle();
    return opts;
  }

  // tint
  final correct = _tintColor(lesson);
  final tints = <Color>[correct];
  for (final e in _tintPalette) {
    if (tints.length >= 4) break;
    if (!tints.contains(e.value)) tints.add(e.value);
  }
  final opts = [
    for (final t in tints)
      ActivityOption(
        emoji: lesson.emoji,
        label: _tintPalette
            .firstWhere((e) => e.value == t, orElse: () => _tintPalette.first)
            .key,
        tint: t,
        isCorrect: t == correct,
      ),
  ]..shuffle();
  return opts;
}

Activity buildActivity(
  CourseLesson lesson,
  ActivityType type,
  Difficulty difficulty,
) {
  switch (type) {
    case ActivityType.listening:
      return _buildListening(lesson, difficulty);
    case ActivityType.choose:
      return _buildChoose(lesson, difficulty);
    case ActivityType.writing:
      return _buildWriting(lesson, difficulty);
    case ActivityType.smartChoose:
      return _buildSmartChoose(lesson, difficulty);
    case ActivityType.matching:
      return _buildMatching(lesson, difficulty);
  }
}

Activity _buildListening(CourseLesson lesson, Difficulty d) {
  final options =
      d == Difficulty.beginner ? _beginnerOptions(lesson) : _variantOptions(lesson);
  final speak = d == Difficulty.advanced ? tomSentenceOf(lesson) : sentenceOf(lesson);
  final question = d == Difficulty.advanced
      ? 'Tom says: "${tomSentenceOf(lesson)}"'
      : d == Difficulty.beginner
          ? 'Listen and choose: ${lesson.word}'
          : sentenceOf(lesson);
  return Activity(
    type: ActivityType.listening,
    difficulty: d,
    instructionAr: 'اسمع ثم اختر الصورة الصحيحة',
    questionEn: question,
    options: options,
    speakText: speak,
  );
}

Activity _buildChoose(CourseLesson lesson, Difficulty d) {
  final options =
      d == Difficulty.beginner ? _beginnerOptions(lesson) : _variantOptions(lesson);
  String question;
  if (d == Difficulty.beginner) {
    question = 'Where is the ${lesson.word}?';
  } else if (d == Difficulty.advanced) {
    question = 'Tom says: "${tomSentenceOf(lesson)}" - choose it.';
  } else {
    question = _mediumQuestion(lesson);
  }
  return Activity(
    type: ActivityType.choose,
    difficulty: d,
    instructionAr: 'اختر الصورة الصحيحة',
    questionEn: question,
    options: options,
    speakText: sentenceOf(lesson),
  );
}

String _mediumQuestion(CourseLesson lesson) {
  final kind = variantKindOf(lesson);
  switch (kind) {
    case VariantKind.action:
      return 'Where is the ${lesson.word.toLowerCase()} that is ${actionOf(lesson)}?';
    case VariantKind.count:
      return 'Where are ${_numberWords[lesson.count - 1]} '
          '${lesson.count == 1 ? 'apple' : 'apples'}?';
    case VariantKind.tint:
      return 'Where is the ${_tintName(lesson)} ${lesson.word.toLowerCase()}?';
    case VariantKind.word:
      return 'Where is "${lesson.word}"?';
  }
}

Activity _buildWriting(CourseLesson lesson, Difficulty d) {
  if (d == Difficulty.beginner) {
    final word = lesson.word.split(' ').first;
    final idx = word.length > 2 ? (word.length ~/ 2) : 0;
    final letter = word[idx];
    final blanked = word.replaceRange(idx, idx + 1, '_');
    final letters = <String>[letter.toUpperCase()];
    for (final c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')) {
      if (letters.length >= 4) break;
      if (!letters.contains(c)) letters.add(c);
    }
    final opts = [
      for (final c in letters)
        ActivityOption(emoji: '', label: c, isCorrect: c == letter.toUpperCase()),
    ]..shuffle();
    return Activity(
      type: ActivityType.writing,
      difficulty: d,
      instructionAr: 'اختر الحرف الناقص',
      questionEn: blanked.toUpperCase(),
      options: opts,
      blankSentence: blanked.toUpperCase(),
      answerWord: word,
      speakText: word,
    );
  }

  final sentence = d == Difficulty.advanced ? tomSentenceOf(lesson) : sentenceOf(lesson);
  final target = lesson.word;
  final blanked = sentence.replaceFirst(
    RegExp(RegExp.escape(target), caseSensitive: false),
    '____',
  );
  final peers = _sectionPeers(lesson)..shuffle();
  final distractors = <String>[];
  for (final p in peers) {
    if (distractors.length >= 3) break;
    if (p.word.toLowerCase() == target.toLowerCase()) continue;
    distractors.add(p.word);
  }
  while (distractors.length < 3) {
    distractors.add(_numberWords[distractors.length]);
  }
  final opts = [
    ActivityOption(emoji: '', label: target, isCorrect: true),
    for (final w in distractors)
      ActivityOption(emoji: '', label: w, isCorrect: false),
  ]..shuffle();
  return Activity(
    type: ActivityType.writing,
    difficulty: d,
    instructionAr: 'اختر الكلمة الناقصة',
    questionEn: blanked,
    options: opts,
    blankSentence: blanked,
    answerWord: target,
    speakText: sentence,
  );
}

Activity _buildSmartChoose(CourseLesson lesson, Difficulty d) {
  if (d == Difficulty.beginner) {
    final section = sectionOf(lesson);
    final inSection = courseLessons
        .where((x) => x.id >= section.start && x.id <= section.end)
        .toList()
      ..shuffle();
    final picked = <CourseLesson>[];
    for (final p in inSection) {
      if (picked.length >= 3) break;
      if (picked.any((e) => e.id == p.id)) continue;
      picked.add(p);
    }
    while (picked.length < 3) {
      picked.add(lesson);
    }
    final outside = _otherSectionLessons(lesson)..shuffle();
    final odd = outside.first;
    final opts = [
      for (final p in picked) _wordOption(p, correct: false),
      _wordOption(odd, correct: true),
    ]..shuffle();
    return Activity(
      type: ActivityType.smartChoose,
      difficulty: d,
      instructionAr: 'اختر الشيء المختلف',
      questionEn: 'Which is NOT a ${section.nameEn}?',
      options: opts,
    );
  }

  final kind = variantKindOf(lesson);
  if (kind == VariantKind.word) {
    // Use 3 items from same section + 1 from another section.
    return _buildSmartChoose(lesson, Difficulty.beginner);
  }

  final opts = <ActivityOption>[
    for (var i = 0; i < 3; i++) _targetVariantOption(lesson),
    _oddVariantOption(lesson),
  ]..shuffle();
  final q = kind == VariantKind.action
      ? 'Which is NOT ${actionOf(lesson)}?'
      : kind == VariantKind.count
          ? 'Which is NOT ${_numberWords[lesson.count - 1]}?'
          : 'Which is NOT ${_tintName(lesson)}?';
  return Activity(
    type: ActivityType.smartChoose,
    difficulty: d,
    instructionAr: 'اختر الشيء المختلف',
    questionEn: q,
    options: opts,
  );
}

ActivityOption _targetVariantOption(CourseLesson lesson) {
  final kind = variantKindOf(lesson);
  switch (kind) {
    case VariantKind.action:
      final a = actionOf(lesson);
      return ActivityOption(
        emoji: lesson.emoji,
        label: a,
        badge: _actionEmoji[a],
        isCorrect: false,
      );
    case VariantKind.count:
      return ActivityOption(
        emoji: lesson.emoji,
        label: '${lesson.count}',
        count: lesson.count,
        isCorrect: false,
      );
    case VariantKind.tint:
      return ActivityOption(
        emoji: lesson.emoji,
        label: _tintName(lesson),
        tint: _tintColor(lesson),
        isCorrect: false,
      );
    case VariantKind.word:
      return _wordOption(lesson, correct: false);
  }
}

ActivityOption _oddVariantOption(CourseLesson lesson) {
  final kind = variantKindOf(lesson);
  switch (kind) {
    case VariantKind.action:
      final target = actionOf(lesson);
      final odd = _actions.firstWhere((a) => a != target);
      return ActivityOption(
        emoji: lesson.emoji,
        label: odd,
        badge: _actionEmoji[odd],
        isCorrect: true,
      );
    case VariantKind.count:
      final odd = lesson.count == 1 ? 2 : 1;
      return ActivityOption(
        emoji: lesson.emoji,
        label: '$odd',
        count: odd,
        isCorrect: true,
      );
    case VariantKind.tint:
      final target = _tintColor(lesson);
      final oddEntry = _tintPalette.firstWhere((e) => e.value != target);
      return ActivityOption(
        emoji: lesson.emoji,
        label: oddEntry.key,
        tint: oddEntry.value,
        isCorrect: true,
      );
    case VariantKind.word:
      final outside = _otherSectionLessons(lesson)..shuffle();
      return _wordOption(outside.first, correct: true);
  }
}

Activity _buildMatching(CourseLesson lesson, Difficulty d) {
  final peers = _sectionPeers(lesson)..shuffle();
  final chosen = <CourseLesson>[lesson];
  for (final p in peers) {
    if (chosen.length >= 3) break;
    if (p.emoji == lesson.emoji) continue;
    if (chosen.any((e) => e.emoji == p.emoji)) continue;
    chosen.add(p);
  }
  while (chosen.length < 3) {
    final extra = _otherSectionLessons(lesson)..shuffle();
    for (final e in extra) {
      if (chosen.length >= 3) break;
      if (e.emoji == lesson.emoji) continue;
      if (chosen.any((x) => x.emoji == e.emoji)) continue;
      chosen.add(e);
    }
  }
  final pairs = <MatchPair>[];
  for (final c in chosen) {
    if (d == Difficulty.beginner) {
      pairs.add(MatchPair(
        left: c.word,
        emoji: c.emoji,
        label: c.word,
        tint: c.tint,
        count: c.count,
      ));
    } else if (d == Difficulty.intermediate) {
      pairs.add(MatchPair(
        left: sentenceOf(c),
        emoji: c.emoji,
        label: c.word,
        tint: c.tint,
        count: c.count,
      ));
    } else {
      pairs.add(MatchPair(
        left: 'Tom says: ${tomSentenceOf(c)}',
        emoji: c.emoji,
        label: c.word,
        tint: c.tint,
        count: c.count,
      ));
    }
  }
  return Activity(
    type: ActivityType.matching,
    difficulty: d,
    instructionAr: 'طابق الكلمة بالصورة',
    questionEn: d == Difficulty.beginner
        ? 'Match the word with the picture'
        : d == Difficulty.intermediate
            ? 'Match the sentence with the picture'
            : 'Match what Tom said with the picture',
    pairs: pairs,
  );
}

// ============================================================
// COLORING PAGES
// ============================================================

/// Returns 5 coloring asset paths for a lesson.
/// Lessons 1-20 use the 100 attached pages sequentially (5 each).
/// Lessons 21-100 cycle through the same 100 pages.
List<String> coloringPagesFor(int lessonId) {
  final pages = <String>[];
  for (var i = 0; i < 5; i++) {
    final idx = ((lessonId - 1) * 5 + i) % 100 + 1;
    pages.add('assets/coloring/coloring_${idx.toString().padLeft(3, '0')}.jpg');
  }
  return pages;
}

/// Arabic instruction for each coloring page.
List<String> coloringPromptsFor(CourseLesson lesson) {
  final word = lesson.word;
  return [
    'لوّن صورة درس $word 🎨',
    'لوّن صورة درس $word بألوان مختلفة',
    'لوّن صورة درس $word وأضف لمسة جميلة',
    'لوّن صورة درس $word كما تحب',
    'لوّن كما تحب! 🎨',
  ];
}
