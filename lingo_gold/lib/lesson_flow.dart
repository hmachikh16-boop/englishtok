import 'dart:async';

import 'package:flutter/material.dart';

import 'data.dart';
import 'lesson_choice.dart';
import 'lesson_coloring.dart';
import 'lesson_matching.dart';
import 'lesson_smart_choose.dart';
import 'lesson_speaking.dart';
import 'lesson_writing.dart';
import 'theme.dart';
import 'widgets.dart';

/// Returns 3 distractors from the same category as the lesson.
List<Lesson> pickDistractors(int lessonIndex, int count) {
  final lesson = lessons[lessonIndex];
  final groupIndex = lessonIndex ~/ 10;
  final pool = _categoryPool(lessonIndex);
  final result = <Lesson>[];

  // Special lessons (1, 2, 3, 10): use category-appropriate images only.
  if (_isSpecialLesson(lessonIndex)) {
    return _specialDistractors(lessonIndex, count);
  }

  bool acceptable(Lesson candidate) {
    if (candidate.imageFile == lesson.imageFile &&
        candidate.word.toLowerCase() == lesson.word.toLowerCase()) {
      return false;
    }
    if (groupIndex != 0 && candidate.word.toLowerCase() == lesson.word.toLowerCase()) {
      return false;
    }
    if (groupIndex == 0 &&
        candidate.word.toLowerCase() == lesson.word.toLowerCase()) {
      return false;
    }
    if (result.any((l) => l.imageFile == candidate.imageFile && l.word.toLowerCase() == candidate.word.toLowerCase())) {
      return false;
    }
    return true;
  }

  if (groupIndex == 0) {
    final seen = <String>{lesson.word.toLowerCase()};
    for (final candidate in pool) {
      if (candidate.imageFile == lesson.imageFile) continue;
      if (seen.contains(candidate.word.toLowerCase())) continue;
      seen.add(candidate.word.toLowerCase());
      result.add(candidate);
      if (result.length >= count) break;
    }
    if (result.length < count) {
      for (final candidate in pool) {
        if (candidate.imageFile == lesson.imageFile) continue;
        if (result.any((l) => l.imageFile == candidate.imageFile)) continue;
        result.add(candidate);
        if (result.length >= count) break;
      }
    }
  }

  if (result.length < count) {
    for (final candidate in pool) {
      if (acceptable(candidate)) {
        result.add(candidate);
        if (result.length >= count) break;
      }
    }
  }

  for (var i = 0; i < lessons.length && result.length < count; i++) {
    final candidate = lessons[i];
    if (acceptable(candidate)) result.add(candidate);
  }
  return result;
}

List<Lesson> _categoryPool(int lessonIndex) {
  final lesson = lessons[lessonIndex];
  final groupIndex = lessonIndex ~/ 10;

  if (groupIndex == 3 || groupIndex == 4) {
    final fruitLesson = isFruitWord(lesson.word);
    return [
      for (var i = 30; i < 50; i++)
        if (isFruitWord(lessons[i].word) == fruitLesson) lessons[i],
    ];
  }

  final start = groupIndex * 10;
  final end = (start + 10).clamp(0, lessons.length);
  return [for (var i = start; i < end; i++) lessons[i]];
}

bool _isSpecialLesson(int lessonIndex) =>
    lessonIndex == 0 || lessonIndex == 1 || lessonIndex == 2 || lessonIndex == 9;

Lesson _syntheticLesson(String imageFile, bool isPack, int indexInPack, String word) {
  return Lesson(
    word: word,
    sentence: '',
    options: [word],
    imageFile: imageFile,
    indexInPack: indexInPack,
    isPack: isPack,
    translation: '',
    category: 'Special',
  );
}

List<Lesson> _specialDistractors(int lessonIndex, int count) {
  switch (lessonIndex) {
    case 0:
    case 1:
    case 2:
      return [
        _syntheticLesson('q1', false, 0, 'are'),
        _syntheticLesson('q8', false, 0, 'is'),
        _syntheticLesson('n01', true, 0, 'boy'),
      ].take(count).toList();
    case 9:
      return [
        _syntheticLesson('n66', true, 0, 'MOON'),
        _syntheticLesson('n67', true, 0, 'STARS'),
        _syntheticLesson('n69', true, 0, 'SUNFLOWER'),
      ].take(count).toList();
  }
  return [];
}

List<Lesson> _specialMatchingPairs(int lessonIndex) {
  switch (lessonIndex) {
    case 0:
      return [
        _syntheticLesson('q0', false, 0, 'I am'),
        _syntheticLesson('q8', false, 0, 'He is'),
        _syntheticLesson('q1', false, 0, 'They are'),
      ];
    case 1:
      return [
        _syntheticLesson('n02', true, 0, 'She is'),
        _syntheticLesson('n01', true, 0, 'We are'),
        _syntheticLesson('n03', true, 0, 'You are'),
      ];
    case 2:
      return [
        _syntheticLesson('q6', false, 0, 'It is'),
        _syntheticLesson('q6', false, 0, 'This is'),
        _syntheticLesson('q6', false, 0, 'That is'),
      ];
    case 9:
      return [
        _syntheticLesson('q9', false, 0, 'SUN'),
        _syntheticLesson('n66', true, 0, 'MOON'),
        _syntheticLesson('n67', true, 0, 'STARS'),
      ];
  }
  return [];
}

List<Lesson> _specialSmartChooseOptions(int lessonIndex) {
  switch (lessonIndex) {
    case 0:
    case 1:
    case 2:
      return [
        _syntheticLesson('q0', false, 0, 'I am'),
        _syntheticLesson('q1', false, 0, 'They are'),
        _syntheticLesson('q8', false, 0, 'He is'),
        _syntheticLesson('n01', true, 0, 'boy'),
      ];
    case 9:
      return [
        _syntheticLesson('q9', false, 0, 'SUN'),
        _syntheticLesson('n66', true, 0, 'MOON'),
        _syntheticLesson('n67', true, 0, 'STARS'),
        _syntheticLesson('n69', true, 0, 'SUNFLOWER'),
      ];
  }
  return [];
}

String _specialSmartChooseQuestion(int lessonIndex) {
  switch (lessonIndex) {
    case 0:
    case 1:
    case 2:
      return 'Which picture is NOT I am?';
    case 9:
      return 'Which picture is NOT sun?';
  }
  return '';
}

String writingWordFor(Lesson lesson, int lessonIndex) {
  final w = lesson.word.toUpperCase();
  if (w == 'IS' || w == 'ARE' || w == 'AM' || w == 'THE' || w == 'A') {
    const grammarWords = [
      'BOY', 'STUDENTS', 'DOG', 'FLOWERS', 'APPLE',
      'CAR', 'CAT', 'HOUSE', 'MAN', 'SUN',
    ];
    if (lessonIndex >= 0 && lessonIndex < grammarWords.length) {
      return grammarWords[lessonIndex];
    }
  }
  return lesson.word;
}

bool isFruitWord(String word) {
  const fruits = {
    'apple',
    'apples',
    'banana',
    'bananas',
    'orange',
    'oranges',
    'strawberry',
    'strawberries',
    'grapes',
    'lemon',
    'lemons',
  };
  return fruits.contains(word.toLowerCase());
}

class LessonFlowScreen extends StatefulWidget {
  final int startLessonId;
  final int totalLessons;
  final void Function(int lessonId)? onLessonComplete;
  final VoidCallback? onExit;

  const LessonFlowScreen({
    super.key,
    required this.startLessonId,
    this.totalLessons = 100,
    this.onLessonComplete,
    this.onExit,
  });

  @override
  State<LessonFlowScreen> createState() => _LessonFlowScreenState();
}

class _LessonFlowScreenState extends State<LessonFlowScreen> {
  late int _lessonId;
  int _step = 0;
  int _score = 0;
  int _speakingScore = 0;
  int _coloringPage = 0;
  bool _rewardVisible = false;
  bool _congratsVisible = false;

  int get _lessonIndex => (_lessonId - 1).clamp(0, lessons.length - 1);
  Lesson get _lesson => lessons[_lessonIndex];
  List<Lesson> get _distractors => pickDistractors(_lessonIndex, 3);

  @override
  void initState() {
    super.initState();
    _lessonId = widget.startLessonId.clamp(1, widget.totalLessons);
  }

  String get _title {
    switch (_step) {
      case 0:
        return 'درس الاستماع';
      case 1:
        return 'درس التحدث';
      case 2:
        return 'درس المطابقة';
      case 3:
        return 'درس الكتابة';
      case 4:
        return _isSpecialLesson(_lessonIndex) ? 'الاختيار الذكي' : 'التلوين';
      default:
        return 'مراجعة الدرس';
    }
  }

  void _onSimpleComplete(bool correct) {
    _completeStep(correct: correct);
  }

  void _completeStep({required bool correct, int? speakingScore}) {
    if (_step == 1) {
      _speakingScore = speakingScore ?? 0;
    }
    if (correct) _score++;
    setState(() => _step++);
  }

  void _onColoringPageDone() {
    if (_coloringPage < 4) {
      setState(() => _coloringPage++);
    } else {
      setState(() {
        _coloringPage = 0;
        _step = 5;
      });
    }
  }

  void _reset() {
    setState(() {
      _step = 0;
      _score = 0;
      _speakingScore = 0;
      _coloringPage = 0;
    });
  }

  Future<void> _nextLesson() async {
    widget.onLessonComplete?.call(_lessonId);

    if (_lessonId >= widget.totalLessons) {
      setState(() => _congratsVisible = true);
      await Future<void>.delayed(const Duration(seconds: 3));
      if (!mounted) return;
      widget.onExit?.call();
      Navigator.of(context).pop();
      return;
    }

    setState(() => _rewardVisible = true);
    await Future<void>.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() {
      _rewardVisible = false;
      _lessonId++;
      _step = 0;
      _score = 0;
      _speakingScore = 0;
      _coloringPage = 0;
    });
  }

  void _exitToHome() {
    widget.onExit?.call();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final lesson = _lesson;
    final group = groups[(_lessonIndex ~/ 10).clamp(0, groups.length - 1)];
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _LessonTopBar(
                  title: _title,
                  step: _step,
                  lessonNumber: _lessonId,
                  groupName: group.name,
                  onBack: () => Navigator.of(context).pop(),
                  onHome: _exitToHome,
                ),
                Expanded(
                  child: KeyedSubtree(
                    key: ValueKey('$_lessonId-$_step-$_coloringPage'),
                    child: _buildStep(lesson),
                  ),
                ),
              ],
            ),
            if (_rewardVisible) const _RewardOverlay(),
            if (_congratsVisible) const _CongratsOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(Lesson lesson) {
    switch (_step) {
      case 0:
        return ListeningStep(
          lesson: lesson,
          distractors: _distractors,
          onComplete: _onSimpleComplete,
          showTranslation: !_isSpecialLesson(_lessonIndex),
        );
      case 1:
        return SpeakingStep(
          lesson: lesson,
          onComplete: (correct, score) =>
              _completeStep(correct: correct, speakingScore: score),
          showTranslation: !_isSpecialLesson(_lessonIndex),
        );
      case 2:
        if (_isSpecialLesson(_lessonIndex)) {
          final pairs = _specialMatchingPairs(_lessonIndex);
          return MatchingStep(
            lesson: pairs.first,
            distractors: pairs.sublist(1),
            onComplete: _onSimpleComplete,
          );
        }
        return MatchingStep(
          lesson: lesson,
          distractors: _distractors.take(2).toList(),
          onComplete: _onSimpleComplete,
        );
      case 3:
        return WritingStep(
          lesson: lesson,
          targetWord: writingWordFor(lesson, _lessonIndex),
          onComplete: _onSimpleComplete,
        );
      case 4:
        if (_isSpecialLesson(_lessonIndex)) {
          final opts = _specialSmartChooseOptions(_lessonIndex);
          return SmartChooseStep(
            lesson: opts.first,
            lessonIndex: _lessonIndex,
            distractors: opts.sublist(1),
            question: _specialSmartChooseQuestion(_lessonIndex),
            onComplete: _onSimpleComplete,
          );
        }
        return ColoringStep(
          lesson: lesson,
          lessonIndex: _lessonIndex,
          page: _coloringPage,
          onPageDone: _onColoringPageDone,
        );
      default:
        return _ResultStep(
          lesson: lesson,
          score: _score,
          speakingScore: _speakingScore,
          onRepeat: _reset,
          onContinue: _nextLesson,
        );
    }
  }
}

class _LessonTopBar extends StatelessWidget {
  final String title;
  final int step;
  final int lessonNumber;
  final String groupName;
  final VoidCallback onBack;
  final VoidCallback onHome;

  const _LessonTopBar({
    required this.title,
    required this.step,
    required this.lessonNumber,
    required this.groupName,
    required this.onBack,
    required this.onHome,
  });

  @override
  Widget build(BuildContext context) {
    final progress = step >= 5 ? 1.0 : (step + 1) / 5.0;
    final stepLabel = step >= 5 ? 5 : step + 1;
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 6, 12, 10),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: kLine)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: onBack,
                icon: const Icon(
                  Icons.arrow_back_rounded,
                  color: kInk,
                  size: 23,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'LINGO GOLD',
                      style: TextStyle(
                        fontSize: 9.5,
                        letterSpacing: 1.1,
                        fontWeight: FontWeight.w800,
                        color: kPrimary,
                      ),
                    ),
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 18,
                        height: 1.15,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Pill(
                text: step >= 5 ? 'المراجعة' : 'السؤال $stepLabel من 5',
                background: kSoftGreen,
                foreground: kPrimaryDark,
              ),
              IconButton(
                onPressed: onHome,
                icon: const Icon(
                  Icons.home_rounded,
                  color: kInk,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Expanded(
                child: Text(
                  'الدرس $lessonNumber • $groupName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: kMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ),
          const SizedBox(height: 6),
          RoundedProgress(value: progress, height: 6),
        ],
      ),
    );
  }
}

class _RewardOverlay extends StatelessWidget {
  const _RewardOverlay();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.35),
        alignment: Alignment.center,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 26),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33000000),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('⭐', style: TextStyle(fontSize: 54)),
              SizedBox(height: 8),
              Text(
                'أحسنت!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: kInk,
                ),
              ),
              SizedBox(height: 4),
              Text(
                '+20 XP',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: kPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CongratsOverlay extends StatelessWidget {
  const _CongratsOverlay();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.4),
        alignment: Alignment.center,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 30),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33000000),
                blurRadius: 24,
                offset: Offset(0, 12),
              ),
            ],
          ),
          child: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('🎉', style: TextStyle(fontSize: 58)),
              SizedBox(height: 10),
              Text(
                'مبروك!',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: kInk,
                ),
              ),
              SizedBox(height: 6),
              Text(
                'كملت 100 درس',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: kPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultStep extends StatelessWidget {
  final Lesson lesson;
  final int score;
  final int speakingScore;
  final VoidCallback onRepeat;
  final VoidCallback onContinue;

  const _ResultStep({
    required this.lesson,
    required this.score,
    required this.speakingScore,
    required this.onRepeat,
    required this.onContinue,
  });

  @override
  Widget build(BuildContext context) {
    final stars = score >= 5 ? 3 : (score >= 4 ? 2 : 1);
    final sentence = lesson.sentence.replaceAll('___', lesson.word);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [kPrimary, Color(0xFF16A6A6)],
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x332E9E5B),
                  blurRadius: 24,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0x33FFFFFF),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.emoji_events_rounded,
                    color: Colors.white,
                    size: 34,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'أحسنت!',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'حصلت على $stars ${stars == 1 ? 'نجمة' : 'نجوم'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 10),
                StarRow(filled: stars, size: 34),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SoftCard(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                Row(
                  children: [
                    const CircleIcon(
                      icon: Icons.mic_rounded,
                      background: kSoftBlue,
                      foreground: kSecondary,
                      size: 42,
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'نتيجة النطق',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: kInk,
                        ),
                      ),
                    ),
                    Text(
                      speakingScore > 0 ? '$speakingScore%' : '—',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kPrimaryDark,
                      ),
                    ),
                  ],
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Divider(height: 1, color: kLine),
                ),
                Row(
                  children: [
                    const CircleIcon(
                      icon: Icons.checklist_rounded,
                      background: kSoftGreen,
                      foreground: kPrimary,
                      size: 42,
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'نتيجة الدرس',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: kInk,
                        ),
                      ),
                    ),
                    Text(
                      '$score/5',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                RoundedProgress(value: score / 5, height: 8),
                const SizedBox(height: 16),
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: SizedBox(
                        width: 62,
                        height: 62,
                        child: LessonImage(lesson: lesson),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sentence,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: kInk,
                            ),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'واصل التدريب لبناء ثقتك.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: kMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onRepeat,
                  icon: const Icon(Icons.replay_rounded, size: 20),
                  label: const Text('إعادة'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  onPressed: onContinue,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                  label: const Text('الدرس التالي ->'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
