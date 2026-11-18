import 'dart:math';

import 'package:flutter/material.dart';

import 'data.dart';
import 'services/sound_service.dart';
import 'theme.dart';
import 'widgets.dart';

class SmartChooseStep extends StatefulWidget {
  final Lesson lesson;
  final int lessonIndex;
  final List<Lesson> distractors;
  final String? question;
  final ValueChanged<bool> onComplete;

  const SmartChooseStep({
    super.key,
    required this.lesson,
    required this.lessonIndex,
    required this.distractors,
    this.question,
    required this.onComplete,
  });

  @override
  State<SmartChooseStep> createState() => _SmartChooseStepState();
}

class _SmartChooseStepState extends State<SmartChooseStep> {
  late final List<Lesson> _options;
  int? _selected;
  bool _checked = false;
  bool _hadWrong = false;

  @override
  void initState() {
    super.initState();
    _options = [widget.lesson, ...widget.distractors];
    _options.shuffle(Random(widget.lesson.word.hashCode + 7));
  }

  bool _isTarget(Lesson l) {
    if (widget.lessonIndex ~/ 10 == 0) {
      return l.imageFile == widget.lesson.imageFile;
    }
    return l.word.toLowerCase() == widget.lesson.word.toLowerCase();
  }

  bool get _isCorrect =>
      _selected != null && _isTarget(_options[_selected!]);

  String get _category {
    final group = widget.lessonIndex ~/ 10;
    switch (group) {
      case 0:
        return 'word';
      case 1:
        return 'person';
      case 3:
      case 4:
        return isFruitWord(widget.lesson.word) ? 'fruit' : 'food';
      case 5:
        return 'animal';
      case 9:
        return 'job';
      default:
        return 'picture';
    }
  }

  String get _question => widget.question ?? 'Which $_category is NOT ${widget.lesson.word}?';

  void _select(int index) {
    if (_checked && _isCorrect) return;
    setState(() {
      _selected = index;
      _checked = false;
    });
  }

  void _check() {
    if (_selected == null) return;
    final correct = _isTarget(_options[_selected!]);
    setState(() {
      _checked = true;
      if (!correct) _hadWrong = true;
    });
    if (correct) {
      SoundService.instance.playCorrect();
    } else {
      SoundService.instance.playError();
    }
  }

  void _reset() {
    setState(() {
      _selected = null;
      _checked = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isCorrect = _checked && _isCorrect;
    final isWrong = _checked && _selected != null && !isCorrect;
    final selectedLesson =
        _selected == null ? null : _options[_selected!];
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SoftCard(
            color: kSoftGreen,
            border: Border.all(color: kPrimary.withValues(alpha: 0.2)),
            child: Row(
              children: [
                const CircleIcon(
                  icon: Icons.psychology_rounded,
                  background: Colors.white,
                  foreground: kPrimary,
                  size: 48,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Directionality(
                        textDirection: TextDirection.ltr,
                        child: Text(
                          _question,
                          style: const TextStyle(
                            fontSize: 19,
                            height: 1.2,
                            fontWeight: FontWeight.w800,
                            color: kInk,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'اختر الصورة التي تمثل الكلمة المطلوبة.',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: kMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _options.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
            ),
            itemBuilder: (context, index) {
              final option = _options[index];
              final selected = _selected == index;
              final correct = _checked && selected && _isCorrect;
              final wrong = _checked && selected && !_isCorrect;
              return GestureDetector(
                onTap: () => _select(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: correct
                          ? kPrimary
                          : (wrong
                              ? kDanger
                              : (selected ? kSecondary : kLine)),
                      width: selected || correct || wrong ? 3 : 2,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: LessonImage(lesson: option),
                ),
              );
            },
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 20,
            child: Center(
              child: Text(
                _selected == null
                    ? 'اختر صورة للمتابعة'
                    : (!_checked
                        ? 'اضغط تحقق للتأكد من إجابتك.'
                        : (isCorrect
                            ? 'أحسنت! هذه هي ${widget.lesson.word}.'
                            : 'هذه ليست ${widget.lesson.word}. اختر الصورة الصحيحة.')),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: isCorrect ? kPrimary : (isWrong ? kDanger : kMuted),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          if (isCorrect)
            FilledButton(
              onPressed: () => widget.onComplete(!_hadWrong),
              child: const Text('متابعة'),
            )
          else if (isWrong)
            FilledButton(
              onPressed: _reset,
              style: FilledButton.styleFrom(backgroundColor: kDanger),
              child: const Text('حاول مجدداً'),
            )
          else if (_selected == null)
            FilledButton(
              onPressed: null,
              child: const Text('اختر صورة'),
            )
          else
            FilledButton(
              onPressed: _check,
              child: const Text('تحقق'),
            ),
        ],
      ),
    );
  }
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
