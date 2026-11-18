import 'package:flutter/material.dart';

import 'data.dart';
import 'services/sound_service.dart';
import 'theme.dart';
import 'widgets.dart';

class WritingStep extends StatefulWidget {
  final Lesson lesson;
  final String? targetWord;
  final ValueChanged<bool> onComplete;

  const WritingStep({
    super.key,
    required this.lesson,
    this.targetWord,
    required this.onComplete,
  });

  @override
  State<WritingStep> createState() => _WritingStepState();
}

class _WritingStepState extends State<WritingStep> {
  String _typed = '';

  String get _target => widget.targetWord ?? widget.lesson.word;
  String get _targetLetters => _target.replaceAll(' ', '');
  String get _typedLetters => _typed.replaceAll(' ', '');
  bool get _correct =>
      _typedLetters.isNotEmpty &&
      _typedLetters.toLowerCase() == _targetLetters.toLowerCase();

  void _key(String key) {
    if (key == ' ') {
      if (_typed.length >= _target.length + 2) return;
      setState(() => _typed += ' ');
      return;
    }
    if (_typedLetters.length >= _targetLetters.length) return;
    setState(() => _typed += key);
    // Play feedback after the state update.
    final nowCorrect = _typedLetters.isNotEmpty &&
        _typedLetters.toLowerCase() == _targetLetters.toLowerCase();
    if (nowCorrect) {
      SoundService.instance.playCorrect();
    } else if (_typedLetters.length >= _targetLetters.length) {
      SoundService.instance.playError();
    }
  }

  void _backspace() {
    if (_typed.isEmpty) return;
    setState(() => _typed = _typed.substring(0, _typed.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    final wrong =
        !_correct && _typedLetters.length >= _targetLetters.length;
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
                  text: 'الكتابة',
                  background: Color(0xEFFFFFFF),
                  foreground: kPrimaryDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'اكتب الكلمة',
                      style: TextStyle(
                        fontSize: 24,
                        height: 1.15,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'انظر إلى الصورة واكتب الكلمة بالإنجليزية.',
                      style: TextStyle(
                        fontSize: 12,
                        color: kMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Pill(
                text: '${_targetLetters.length} حروف',
                background: kSoftBlue,
                foreground: kSecondary,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Directionality(
            textDirection: TextDirection.ltr,
            child: Wrap(
              alignment: WrapAlignment.center,
              spacing: 6,
              runSpacing: 7,
            children: List.generate(_targetLetters.length, (i) {
              final expected = _targetLetters[i].toLowerCase();
              final actual = i < _typedLetters.length
                  ? _typedLetters[i].toLowerCase()
                  : '';
              final isFilled = actual.isNotEmpty;
              final isCorrectLetter = isFilled && actual == expected;
              final borderColor = !isFilled
                  ? kLine
                  : (isCorrectLetter ? kPrimary : kDanger);
              return Container(
                width: 34,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isCorrectLetter ? kSoftGreen : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: borderColor, width: 1.6),
                ),
                child: Text(
                  actual.toUpperCase(),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isCorrectLetter ? kPrimaryDark : kInk,
                  ),
                ),
              );
            }),
          ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 18,
            child: Center(
              child: _correct
                  ? const Text(
                      'صحيح! عمل رائع.',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: kPrimary,
                      ),
                    )
                  : (wrong
                      ? const Text(
                          'حاول مجدداً. استخدم مفتاح الحذف.',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: kDanger,
                          ),
                        )
                      : null),
            ),
          ),
          const SizedBox(height: 4),
          Directionality(
            textDirection: TextDirection.ltr,
            child: _Keyboard(onKey: _key, onBackspace: _backspace),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _correct ? () => widget.onComplete(true) : null,
              child: Text(_correct ? 'متابعة' : 'اكتب الكلمة'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Keyboard extends StatelessWidget {
  final ValueChanged<String> onKey;
  final VoidCallback onBackspace;

  const _Keyboard({required this.onKey, required this.onBackspace});

  static const _rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kLine),
      ),
      child: Column(
        children: [
          for (final row in _rows)
            Padding(
              padding: const EdgeInsets.only(bottom: 5),
              child: Row(
                children: row.split('').map((letter) {
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: _Key(
                        label: letter,
                        onTap: () => onKey(letter),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          Row(
            children: [
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _Key(
                    label: 'مسافة',
                    onTap: () => onKey(' '),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _Key(
                    icon: Icons.backspace_outlined,
                    onTap: onBackspace,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Key extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final VoidCallback onTap;

  const _Key({this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Container(
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: kLine),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: icon != null
              ? Icon(icon, size: 19, color: kInk)
              : Text(
                  label ?? '',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: kInk,
                  ),
                ),
        ),
      ),
    );
  }
}
