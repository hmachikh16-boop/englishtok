import 'package:flutter/material.dart';

import 'data.dart';
import 'lesson_choice.dart';
import 'lesson_fill_arrange.dart';
import 'lesson_matching.dart';
import 'lesson_speaking.dart';
import 'lesson_writing.dart';
import 'theme.dart';
import 'widgets.dart';

class LessonResult {
  final int score;
  final int speakingScore;
  const LessonResult({required this.score, required this.speakingScore});
}

List<Lesson> pickDistractors(int lessonIndex, int count) {
  final lesson = lessons[lessonIndex];
  final groupIndex = lessonIndex ~/ 10;
  final groupStart = groupIndex * 10;
  final groupEnd = groupStart + 10;
  final isGrammar = groupIndex == 0;
  final result = <Lesson>[];

  bool acceptable(Lesson candidate) {
    if (candidate.imageFile == lesson.imageFile) return false;
    if (!isGrammar &&
        candidate.word.toLowerCase() == lesson.word.toLowerCase()) {
      return false;
    }
    if (result.any((l) => l.imageFile == candidate.imageFile)) return false;
    return true;
  }

  // Same group only: Numbers stay with Numbers, Jobs with Jobs, etc.
  for (var i = groupStart; i < groupEnd && result.length < count; i++) {
    final candidate = lessons[i];
    if (acceptable(candidate)) result.add(candidate);
  }

  // Safety fallback only if the group is too small (never expected: 10/group).
  for (var i = 0; i < lessons.length && result.length < count; i++) {
    final candidate = lessons[i];
    if (acceptable(candidate)) result.add(candidate);
  }
  return result;
}

class LessonFlowScreen extends StatefulWidget {
  final int lessonIndex;
  const LessonFlowScreen({super.key, required this.lessonIndex});

  @override
  State<LessonFlowScreen> createState() => _LessonFlowScreenState();
}

class _LessonFlowScreenState extends State<LessonFlowScreen> {
  int _step = 0;
  int _score = 0;
  int _speakingScore = 0;
  late final List<Lesson> _distractors;

  @override
  void initState() {
    super.initState();
    _distractors = pickDistractors(widget.lessonIndex, 3);
  }

  String get _title {
    switch (_step) {
      case 0:
        return 'درس التحدث';
      case 1:
        return 'درس الكتابة';
      case 2:
        return widget.lessonIndex.isEven ? 'درس الاختيار' : 'املأ الفراغ';
      case 3:
        return 'درس الاستماع';
      case 4:
        return widget.lessonIndex.isEven ? 'درس المطابقة' : 'رتّب الكلمات';
      default:
        return 'مراجعة الدرس';
    }
  }

  void _onSimpleComplete(bool correct) {
    _completeStep(correct: correct);
  }

  void _completeStep({required bool correct, int? speakingScore}) {
    if (_step == 0) {
      _speakingScore = speakingScore ?? 0;
    }
    if (correct) _score++;
    setState(() => _step++);
  }

  void _reset() {
    setState(() {
      _step = 0;
      _score = 0;
      _speakingScore = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final lesson = lessons[widget.lessonIndex];
    final group = groups[(widget.lessonIndex ~/ 10)
        .clamp(0, groups.length - 1)
        .toInt()];
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            _LessonTopBar(
              title: _title,
              step: _step,
              lessonNumber: widget.lessonIndex + 1,
              groupName: group.name,
              onBack: () => Navigator.of(context).pop(),
            ),
            Expanded(
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: _buildStep(lesson),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(Lesson lesson) {
    switch (_step) {
      case 0:
        return SpeakingStep(
          lesson: lesson,
          onComplete: (correct, score) =>
              _completeStep(correct: correct, speakingScore: score),
        );
      case 1:
        return WritingStep(lesson: lesson, onComplete: _onSimpleComplete);
      case 2:
        // Grammar (Verb To Be) is text-based: am / is / are.
        // Vocabulary groups use image choices.
        if (widget.lessonIndex ~/ 10 != 0 && widget.lessonIndex.isEven) {
          return ChooseStep(
            lesson: lesson,
            distractors: _distractors,
            onComplete: _onSimpleComplete,
          );
        }
        return FillBlankStep(
          lesson: lesson,
          distractors: _distractors,
          onComplete: _onSimpleComplete,
        );
      case 3:
        return ListeningStep(
          lesson: lesson,
          distractors: _distractors,
          onComplete: _onSimpleComplete,
        );
      case 4:
        if (widget.lessonIndex ~/ 10 != 0 && widget.lessonIndex.isEven) {
          return MatchingStep(
            lesson: lesson,
            distractors: _distractors.take(2).toList(),
            onComplete: _onSimpleComplete,
          );
        }
        return ArrangeWordsStep(
          lesson: lesson,
          onComplete: _onSimpleComplete,
        );
      default:
        return _ResultStep(
          lesson: lesson,
          score: _score,
          speakingScore: _speakingScore,
          onRepeat: _reset,
          onContinue: () => Navigator.of(context).pop(
            LessonResult(score: _score, speakingScore: _speakingScore),
          ),
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

  const _LessonTopBar({
    required this.title,
    required this.step,
    required this.lessonNumber,
    required this.groupName,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final progress = step >= 5 ? 1.0 : (step + 1) / 5.0;
    final stepLabel = step >= 5 ? 5 : step + 1;
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 6, 16, 10),
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
              const SizedBox(width: 8),
              Pill(
                text: 'السؤال $stepLabel من 5',
                background: kSoftGreen,
                foreground: kPrimaryDark,
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
