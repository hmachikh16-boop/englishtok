import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'data.dart';
import 'services/sound_service.dart';
import 'services/speech_service.dart';
import 'theme.dart';
import 'widgets.dart';

class ImageChoiceGrid extends StatelessWidget {
  final List<Lesson> choices;
  final int? selectedIndex;
  final int correctIndex;
  final bool showResult;
  final ValueChanged<int> onTap;

  const ImageChoiceGrid({
    super.key,
    required this.choices,
    required this.selectedIndex,
    required this.correctIndex,
    this.showResult = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: choices.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 16 / 9,
      ),
      itemBuilder: (context, index) {
        final isSelected = selectedIndex == index;
        final isCorrect = index == correctIndex;
        final selectedCorrect = isSelected && isCorrect;
        final selectedWrong = isSelected && !isCorrect;
        final revealCorrect = showResult && isCorrect && !isSelected;
        final borderColor = !showResult
            ? (isSelected ? kSecondary : kLine)
            : (selectedCorrect || revealCorrect
                ? kPrimary
                : (selectedWrong ? kDanger : kLine));
        final borderWidth =
            isSelected || revealCorrect || selectedWrong ? 3.0 : 1.5;
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => onTap(index),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor, width: borderWidth),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 12,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(13),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    LessonImage(lesson: choices[index]),
                    if (showResult && (selectedCorrect || revealCorrect))
                      const Positioned(
                        top: 8,
                        right: 8,
                        child: _ResultBadge(
                          color: kPrimary,
                          icon: Icons.check_rounded,
                        ),
                      )
                    else if (showResult && selectedWrong)
                      const Positioned(
                        top: 8,
                        right: 8,
                        child: _ResultBadge(
                          color: kDanger,
                          icon: Icons.close_rounded,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ResultBadge extends StatelessWidget {
  final Color color;
  final IconData icon;
  const _ResultBadge({required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: Icon(icon, color: Colors.white, size: 17),
    );
  }
}

class ChooseStep extends StatefulWidget {
  final Lesson lesson;
  final List<Lesson> distractors;
  final ValueChanged<bool> onComplete;

  const ChooseStep({
    super.key,
    required this.lesson,
    required this.distractors,
    required this.onComplete,
  });

  @override
  State<ChooseStep> createState() => _ChooseStepState();
}

class _ChooseStepState extends State<ChooseStep> {
  late final List<Lesson> _choices;
  late final int _correctIndex;
  int? _selected;
  bool _checked = false;
  bool _hadWrong = false;

  String get _sentence =>
      widget.lesson.sentence.replaceAll('___', widget.lesson.word);

  @override
  void initState() {
    super.initState();
    _choices = [widget.lesson, ...widget.distractors];
    _choices.shuffle(Random(widget.lesson.word.hashCode + 11));
    _correctIndex = _choices.indexWhere(
      (lesson) =>
          lesson.word == widget.lesson.word &&
          lesson.imageFile == widget.lesson.imageFile,
    );
  }

  void _select(int index) {
    if (_checked && _selected == _correctIndex) return;
    setState(() {
      _selected = index;
      _checked = false;
    });
  }

  void _check() {
    if (_selected == null) return;
    final correct = _selected == _correctIndex;
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
    final isCorrect = _checked && _selected == _correctIndex;
    final isWrong = _checked && _selected != null && !isCorrect;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Pill(
                text: 'سلسلة 7 أيام',
                icon: Icons.local_fire_department_rounded,
                background: kSoftOrange,
                foreground: Color(0xFFD97706),
              ),
              const Spacer(),
              Pill(
                text: '${_choices.length} خيارات',
                background: kSoftBlue,
                foreground: kSecondary,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'أي صورة تُظهر "$_sentence"?',
            style: const TextStyle(
              fontSize: 23,
              height: 1.2,
              fontWeight: FontWeight.w800,
              color: kInk,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'اضغط على الصورة التي تطابق الجملة.',
            style: TextStyle(
              fontSize: 12.5,
              color: kMuted,
              fontWeight: FontWeight.w500,
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
          ImageChoiceGrid(
            choices: _choices,
            selectedIndex: _selected,
            correctIndex: _correctIndex,
            showResult: _checked,
            onTap: _select,
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 20,
            child: Center(
              child: Text(
                _selected == null
                    ? 'اختر إجابة للمتابعة'
                    : (!_checked
                        ? 'اضغط تحقق للتأكد من إجابتك.'
                        : (isCorrect ? 'أحسنت!' : 'حاول مجدداً.')),
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
              child: const Text('اختر إجابة'),
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

class ListeningStep extends StatefulWidget {
  final Lesson lesson;
  final List<Lesson> distractors;
  final ValueChanged<bool> onComplete;
  final bool showTranslation;

  const ListeningStep({
    super.key,
    required this.lesson,
    required this.distractors,
    required this.onComplete,
    this.showTranslation = true,
  });

  @override
  State<ListeningStep> createState() => _ListeningStepState();
}

class _ListeningStepState extends State<ListeningStep> {
  late final List<Lesson> _choices;
  late final int _correctIndex;
  int? _selected;
  bool _checked = false;
  bool _hadWrong = false;
  bool _speaking = false;

  String get _sentence =>
      widget.lesson.spokenText.replaceAll('___', widget.lesson.word);

  @override
  void initState() {
    super.initState();
    _choices = [widget.lesson, ...widget.distractors];
    _choices.shuffle(Random(widget.lesson.word.hashCode + 23));
    _correctIndex = _choices.indexWhere(
      (lesson) =>
          lesson.word == widget.lesson.word &&
          lesson.imageFile == widget.lesson.imageFile,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _play());
  }

  Future<void> _play() async {
    if (_speaking) return;
    setState(() => _speaking = true);
    await TtsService.instance.speak(_sentence);
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (mounted) setState(() => _speaking = false);
  }

  void _select(int index) {
    if (_checked && _selected == _correctIndex) return;
    setState(() {
      _selected = index;
      _checked = false;
    });
  }

  void _check() {
    if (_selected == null) return;
    final correct = _selected == _correctIndex;
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
    final isCorrect = _checked && _selected == _correctIndex;
    final isWrong = _checked && _selected != null && !isCorrect;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SoftCard(
            color: kSoftBlue,
            border: Border.all(color: kSecondary.withValues(alpha: 0.2)),
            child: Column(
              children: [
                Row(
                  children: [
                    const CircleIcon(
                      icon: Icons.hearing_rounded,
                      background: Colors.white,
                      foreground: kSecondary,
                      size: 48,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'استمع بعناية',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: kInk,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'اضغط على السماعة لسماع الجملة مرة أخرى.',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: kMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        onPressed: _play,
                        icon: const Icon(
                          Icons.volume_up_rounded,
                          color: kSecondary,
                          size: 25,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Waveform(
                  active: _speaking,
                  color: kSecondary,
                  height: 42,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'أي صورة تطابق ما سمعته؟',
            style: TextStyle(
              fontSize: 22,
              height: 1.2,
              fontWeight: FontWeight.w800,
              color: kInk,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'استمع إلى الجملة الإنجليزية، ثم اختر صورة.',
            style: TextStyle(
              fontSize: 12.5,
              color: kMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (widget.showTranslation) ...[
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
          ],
          const SizedBox(height: 14),
          ImageChoiceGrid(
            choices: _choices,
            selectedIndex: _selected,
            correctIndex: _correctIndex,
            showResult: _checked,
            onTap: _select,
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 20,
            child: Center(
              child: Text(
                _selected == null
                    ? 'اختر الصورة التي تطابق الصوت'
                    : (!_checked
                        ? 'اضغط تحقق للتأكد من إجابتك.'
                        : (isCorrect ? 'استماع ممتاز!' : 'حاول مجدداً.')),
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
