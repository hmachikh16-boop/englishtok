import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'data.dart';
import 'theme.dart';
import 'widgets.dart';

class FillBlankStep extends StatefulWidget {
  final Lesson lesson;
  final List<Lesson> distractors;
  final ValueChanged<bool> onComplete;

  const FillBlankStep({
    super.key,
    required this.lesson,
    required this.distractors,
    required this.onComplete,
  });

  @override
  State<FillBlankStep> createState() => _FillBlankStepState();
}

class _FillBlankStepState extends State<FillBlankStep> {
  late final List<String> _choices;
  String? _selected;
  bool _checked = false;
  bool _correct = false;
  bool _hadWrong = false;

  String get _before {
    final parts = widget.lesson.sentence.split('___');
    return parts.first;
  }

  String get _after {
    final parts = widget.lesson.sentence.split('___');
    return parts.length > 1 ? parts.sublist(1).join('___') : '';
  }

  @override
  void initState() {
    super.initState();
    final words = <String>[widget.lesson.word];
    void addWord(String raw) {
      final word = raw.trim();
      if (word.isEmpty) return;
      if (words.any((w) => w.toLowerCase() == word.toLowerCase())) return;
      words.add(word);
    }

    for (final distractor in widget.distractors) {
      addWord(distractor.word);
    }
    for (final option in widget.lesson.options) {
      if (words.length >= 4) break;
      addWord(option);
    }
    _choices = words.take(4).toList()
      ..shuffle(Random(widget.lesson.word.hashCode + 41));
  }

  void _select(String word) {
    if (_checked && _correct) return;
    setState(() {
      _selected = word;
      _checked = false;
      _correct = false;
    });
  }

  void _check() {
    if (_selected == null) return;
    final correct = _selected!.toLowerCase() == widget.lesson.word.toLowerCase();
    setState(() {
      _checked = true;
      _correct = correct;
      if (!correct) _hadWrong = true;
    });
    if (correct) {
      SystemSound.play(SystemSoundType.click);
    } else {
      HapticFeedback.vibrate();
    }
  }

  @override
  Widget build(BuildContext context) {
    final sentenceStyle = TextStyle(
      fontSize: 22,
      height: 1.5,
      fontWeight: FontWeight.w800,
      color: _checked && !_correct ? kDanger : kInk,
    );
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: LessonImage(lesson: widget.lesson),
                ),
              ),
              const Positioned(
                top: 12,
                left: 12,
                child: Pill(
                  text: 'املأ الفراغ',
                  background: Color(0xEFFFFFFF),
                  foreground: kSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'املأ الفراغ',
            style: TextStyle(
              fontSize: 24,
              height: 1.15,
              fontWeight: FontWeight.w800,
              color: kInk,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'اختر الكلمة الصحيحة لإكمال الجملة.',
            style: TextStyle(
              fontSize: 12.5,
              color: kMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),
          SoftCard(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
            child: Text.rich(
              textDirection: TextDirection.ltr,
              TextSpan(
                children: [
                  TextSpan(text: _before),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.middle,
                    child: Container(
                      width: 96,
                      height: 32,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: _checked
                                ? (_correct ? kPrimary : kDanger)
                                : kLine,
                            width: 2,
                          ),
                        ),
                      ),
                      child: _selected == null
                          ? const Text(
                              '____',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: kMuted,
                              ),
                            )
                          : FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Text(
                                _selected!,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: _checked
                                      ? (_correct ? kPrimaryDark : kDanger)
                                      : kSecondary,
                                ),
                              ),
                            ),
                    ),
                  ),
                  TextSpan(text: _after),
                ],
              ),
              style: sentenceStyle,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              widget.lesson.translation,
              textDirection: TextDirection.rtl,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.green.shade800,
              ),
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 3.4,
            children: _choices.map((word) {
              final selected = _selected == word;
              return Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => _select(word),
                  child: Container(
                    alignment: Alignment.center,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    decoration: BoxDecoration(
                      color: selected ? kSoftBlue : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selected ? kSecondary : kLine,
                        width: selected ? 2 : 1.2,
                      ),
                    ),
                    child: Text(
                      word,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: selected ? kSecondary : kInk,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 34,
            child: Center(
              child: Text.rich(
                TextSpan(
                  children: _checked
                      ? (_correct
                          ? const [TextSpan(text: 'أحسنت!')]
                          : [
                              const TextSpan(
                                text: 'حاول مجدداً. الإجابة الصحيحة: ',
                              ),
                              TextSpan(
                                text: widget.lesson.word,
                                style: const TextStyle(
                                  color: kPrimary,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ])
                      : const [
                          TextSpan(
                            text: 'اختر الكلمة الصحيحة لإكمال الجملة.',
                          ),
                        ],
                ),
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: _checked
                      ? (_correct ? kPrimary : kDanger)
                      : kMuted,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          if (_checked && _correct)
            FilledButton(
              onPressed: () => widget.onComplete(!_hadWrong),
              child: const Text('متابعة'),
            )
          else if (_checked && !_correct)
            FilledButton(
              onPressed: () => setState(() {
                _checked = false;
                _selected = null;
              }),
              style: FilledButton.styleFrom(backgroundColor: kDanger),
              child: const Text('حاول مجدداً'),
            )
          else
            FilledButton(
              onPressed: _selected == null ? null : _check,
              child: const Text('تحقق'),
            ),
        ],
      ),
    );
  }
}

class _WordItem {
  final int id;
  final String text;
  const _WordItem(this.id, this.text);
}

class ArrangeWordsStep extends StatefulWidget {
  final Lesson lesson;
  final ValueChanged<bool> onComplete;

  const ArrangeWordsStep({
    super.key,
    required this.lesson,
    required this.onComplete,
  });

  @override
  State<ArrangeWordsStep> createState() => _ArrangeWordsStepState();
}

class _ArrangeWordsStepState extends State<ArrangeWordsStep> {
  late final List<String> _target;
  late final List<_WordItem> _items;
  late final List<int?> _placed;
  late final List<int> _available;
  bool _checked = false;
  bool _correct = false;
  bool _hadWrong = false;

  String get _sentence =>
      widget.lesson.sentence.replaceAll('___', widget.lesson.word);

  @override
  void initState() {
    super.initState();
    _target = _sentence
        .split(RegExp(r'\s+'))
        .map((word) => word.replaceAll(RegExp(r'[.,!?]$'), ''))
        .where((word) => word.isNotEmpty)
        .toList();
    _items = List.generate(_target.length, (i) => _WordItem(i, _target[i]));
    _placed = List<int?>.filled(_target.length, null);
    _available = List.generate(_target.length, (i) => i)
      ..shuffle(Random(widget.lesson.word.hashCode + 53));
    var sameOrder = true;
    for (var i = 0; i < _available.length; i++) {
      if (_available[i] != i) {
        sameOrder = false;
        break;
      }
    }
    if (sameOrder && _available.length > 1) {
      final first = _available.removeAt(0);
      _available.add(first);
    }
  }

  void _place(int id) {
    final slot = _placed.indexWhere((word) => word == null);
    if (slot < 0) return;
    setState(() {
      _placed[slot] = id;
      _available.remove(id);
      _checked = false;
      _correct = false;
    });
  }

  void _moveToSlot(int slot, int id) {
    setState(() {
      final previousSlot = _placed.indexWhere((word) => word == id);
      if (previousSlot >= 0) _placed[previousSlot] = null;
      _available.remove(id);
      final replaced = _placed[slot];
      _placed[slot] = id;
      if (replaced != null && !_available.contains(replaced)) {
        _available.add(replaced);
      }
      _checked = false;
      _correct = false;
    });
  }

  void _removeFromSlot(int slot) {
    final id = _placed[slot];
    if (id == null) return;
    setState(() {
      _placed[slot] = null;
      if (!_available.contains(id)) _available.add(id);
      _checked = false;
      _correct = false;
    });
  }

  void _check() {
    if (_placed.any((id) => id == null)) return;
    final assembled =
        _placed.map((id) => _items[id!].text).join(' ');
    final correct = assembled == _target.join(' ');
    setState(() {
      _checked = true;
      _correct = correct;
      if (!correct) _hadWrong = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final allFilled = _placed.every((id) => id != null);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: SizedBox(
                  height: 200,
                  width: double.infinity,
                  child: LessonImage(lesson: widget.lesson),
                ),
              ),
              const Positioned(
                top: 12,
                left: 12,
                child: Pill(
                  text: 'رتّب الكلمات',
                  background: Color(0xEFFFFFFF),
                  foreground: kPrimaryDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'رتّب الكلمات',
            style: TextStyle(
              fontSize: 24,
              height: 1.15,
              fontWeight: FontWeight.w800,
              color: kInk,
            ),
          ),
          const SizedBox(height: 3),
          const Text(
            'اسحب الكلمات إلى الترتيب الصحيح لتطابق الصورة.',
            style: TextStyle(
              fontSize: 12.5,
              color: kMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          Pill(
            text: 'تلميح: انظر إلى الصورة بعناية.',
            icon: Icons.lightbulb_outline_rounded,
            background: kSoftBlue,
            foreground: kSecondary,
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 7,
            runSpacing: 8,
            children: List.generate(_target.length, (slot) {
              final id = _placed[slot];
              return DragTarget<int>(
                onWillAcceptWithDetails: (details) => id != details.data,
                onAcceptWithDetails: (details) =>
                    _moveToSlot(slot, details.data),
                builder: (context, candidate, rejected) {
                  final highlighted = candidate.isNotEmpty;
                  return Container(
                    constraints: const BoxConstraints(minWidth: 66),
                    height: 46,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: id == null ? kCard : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: highlighted
                            ? kSecondary
                            : (id == null ? kLine : kPrimary),
                        width: highlighted || id != null ? 2 : 1.4,
                      ),
                    ),
                    child: id == null
                        ? const SizedBox(width: 52)
                        : Draggable<int>(
                            data: id,
                            feedback: Material(
                              color: Colors.transparent,
                              child: _Bubble(
                                text: _items[id].text,
                                highlighted: true,
                              ),
                            ),
                            childWhenDragging: Opacity(
                              opacity: 0.3,
                              child: Text(
                                _items[id].text,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: kInk,
                                ),
                              ),
                            ),
                            child: GestureDetector(
                              onTap: () => _removeFromSlot(slot),
                              child: Text(
                                _items[id].text,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: kInk,
                                ),
                              ),
                            ),
                          ),
                  );
                },
              );
            }),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _available.map((id) {
              return Draggable<int>(
                data: id,
                feedback: Material(
                  color: Colors.transparent,
                  child: _Bubble(
                    text: _items[id].text,
                    highlighted: true,
                  ),
                ),
                childWhenDragging: Opacity(
                  opacity: 0.3,
                  child: _Bubble(text: _items[id].text),
                ),
                child: GestureDetector(
                  onTap: () => _place(id),
                  child: _Bubble(text: _items[id].text),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 20,
            child: Center(
              child: Text(
                _checked
                    ? (_correct
                        ? 'Great job! The sentence is correct.'
                        : 'ليس تماماً. جرّب ترتيباً آخر.')
                    : allFilled
                        ? 'اضغط تحقق عندما تكون جملتك جاهزة.'
                        : 'ضع جميع الكلمات لبناء الجملة.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: _checked
                      ? (_correct ? kPrimary : kDanger)
                      : kMuted,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          if (_checked && _correct)
            FilledButton(
              onPressed: () => widget.onComplete(!_hadWrong),
              child: const Text('متابعة'),
            )
          else if (_checked && !_correct)
            FilledButton(
              onPressed: () => setState(() => _checked = false),
              style: FilledButton.styleFrom(backgroundColor: kDanger),
              child: const Text('حاول مجدداً'),
            )
          else
            FilledButton(
              onPressed: allFilled ? _check : null,
              child: const Text('تحقق'),
            ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  final String text;
  final bool highlighted;
  const _Bubble({required this.text, this.highlighted = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
      decoration: BoxDecoration(
        color: highlighted ? kSoftBlue : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: highlighted ? kSecondary : kLine,
          width: highlighted ? 2 : 1.2,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          color: kInk,
        ),
      ),
    );
  }
}
