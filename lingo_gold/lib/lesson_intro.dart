import 'package:flutter/material.dart';

import 'data.dart';
import 'services/speech_service.dart';
import 'theme.dart';
import 'widgets.dart';

/// A short listening-first introduction that teaches the names of every image
/// used in the lesson before the learner starts the exercises.
class LessonIntroStep extends StatefulWidget {
  final List<Lesson> items;
  final VoidCallback onComplete;

  const LessonIntroStep({
    super.key,
    required this.items,
    required this.onComplete,
  });

  @override
  State<LessonIntroStep> createState() => _LessonIntroStepState();
}

class _LessonIntroStepState extends State<LessonIntroStep> {
  int _index = 0;

  Lesson get _item => widget.items[_index];

  bool get _isLast => _index >= widget.items.length - 1;

  String get _label {
    final sentence = _item.sentence.trim();
    return sentence.isNotEmpty ? sentence : _item.word;
  }

  String get _spokenLabel {
    final sentence = _item.spokenText.trim();
    return sentence.isNotEmpty ? sentence : _item.word;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _speak());
  }

  Future<void> _speak() async {
    if (!mounted) return;
    await TtsService.instance.speak(_spokenLabel);
  }

  void _next() {
    if (_isLast) {
      widget.onComplete();
      return;
    }
    setState(() => _index++);
    WidgetsBinding.instance.addPostFrameCallback((_) => _speak());
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'لا توجد كلمات لهذا الدرس.',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: kInk,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: widget.onComplete,
                child: const Text('ابدأ التمارين'),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SoftCard(
            child: Row(
              children: [
                CircleIcon(
                  icon: Icons.headphones_rounded,
                  background: kSoftBlue,
                  foreground: kSecondary,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'تعلّم الكلمات',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: kInk,
                        ),
                      ),
                      SizedBox(height: 3),
                      Text(
                        'استمع لكل صورة، ثم اضغط التالي.',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: kMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: SizedBox(
                  height: 240,
                  width: double.infinity,
                  child: LessonImage(lesson: _item),
                ),
              ),
              const Positioned(
                top: 12,
                left: 12,
                child: Pill(
                  text: 'تعلّم',
                  background: Color(0xEFFFFFFF),
                  foreground: kSecondary,
                ),
              ),
              Positioned(
                right: 12,
                bottom: 12,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  child: IconButton(
                    onPressed: _speak,
                    tooltip: 'إعادة السماع',
                    icon: const Icon(
                      Icons.volume_up_rounded,
                      color: kSecondary,
                      size: 26,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Directionality(
            textDirection: TextDirection.ltr,
            child: Text(
              _label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 25,
                height: 1.2,
                fontWeight: FontWeight.w800,
                color: kInk,
              ),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'اضغط على السماعة لإعادة السماع',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              color: kMuted,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${_index + 1} / ${widget.items.length}',
            textDirection: TextDirection.ltr,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: kMuted,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < widget.items.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _index ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: i == _index ? kPrimary : kLine,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _next,
              child: Text(_isLast ? 'ابدأ التمارين' : 'التالي'),
            ),
          ),
          TextButton(
            onPressed: widget.onComplete,
            style: TextButton.styleFrom(foregroundColor: kMuted),
            child: const Text('تخطي المقدمة'),
          ),
        ],
      ),
    );
  }
}
