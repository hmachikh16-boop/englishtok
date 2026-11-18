import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';

import 'data.dart';
import 'services/sound_service.dart';
import 'theme.dart';
import 'widgets.dart';

class _MatchLine {
  final Offset start;
  final Offset end;
  const _MatchLine(this.start, this.end);
}

class MatchingStep extends StatefulWidget {
  final Lesson lesson;
  final List<Lesson> distractors;
  final ValueChanged<bool> onComplete;

  const MatchingStep({
    super.key,
    required this.lesson,
    required this.distractors,
    required this.onComplete,
  });

  @override
  State<MatchingStep> createState() => _MatchingStepState();
}

class _MatchingStepState extends State<MatchingStep> {
  late final List<Lesson> _pairs;
  late final List<int> _wordOrder;
  final Set<int> _matched = {};
  final List<GlobalKey> _imageKeys = List.generate(3, (_) => GlobalKey());
  final List<GlobalKey> _wordKeys = List.generate(3, (_) => GlobalKey());
  final GlobalKey _stackKey = GlobalKey();
  List<_MatchLine> _lines = [];
  int? _wrongImage;
  int? _selectedWord;
  bool _hadWrong = false;
  Timer? _wrongTimer;

  @override
  void initState() {
    super.initState();
    _pairs = [widget.lesson, ...widget.distractors];
    _wordOrder = List.generate(_pairs.length, (i) => i)
      ..shuffle(Random(widget.lesson.word.hashCode + 31));
  }

  @override
  void dispose() {
    _wrongTimer?.cancel();
    super.dispose();
  }

  void _tryMatch(int imageIndex, int wordPairIndex) {
    if (_matched.contains(imageIndex)) return;
    if (imageIndex == wordPairIndex) {
      SoundService.instance.playCorrect();
      setState(() {
        _matched.add(imageIndex);
        _selectedWord = null;
        _wrongImage = null;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _updateLines());
    } else {
      SoundService.instance.playError();
      _wrongTimer?.cancel();
      setState(() {
        _hadWrong = true;
        _wrongImage = imageIndex;
        _selectedWord = null;
      });
      _wrongTimer = Timer(const Duration(milliseconds: 700), () {
        if (mounted) setState(() => _wrongImage = null);
      });
    }
  }

  void _updateLines() {
    if (!mounted) return;
    final stackBox =
        _stackKey.currentContext?.findRenderObject() as RenderBox?;
    if (stackBox == null) return;
    final lines = <_MatchLine>[];
    for (final index in _matched) {
      final imageContext = _imageKeys[index].currentContext;
      final wordContext = _wordKeys[index].currentContext;
      if (imageContext == null || wordContext == null) continue;
      final imageBox = imageContext.findRenderObject() as RenderBox?;
      final wordBox = wordContext.findRenderObject() as RenderBox?;
      if (imageBox == null || wordBox == null) continue;
      final imageOffset = imageBox.localToGlobal(
        Offset(imageBox.size.width, imageBox.size.height / 2),
        ancestor: stackBox,
      );
      final wordOffset = wordBox.localToGlobal(
        Offset(0, wordBox.size.height / 2),
        ancestor: stackBox,
      );
      lines.add(_MatchLine(imageOffset, wordOffset));
    }
    setState(() => _lines = lines);
  }

  @override
  Widget build(BuildContext context) {
    final done = _matched.length == _pairs.length;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Pill(
                text: 'المطابقة',
                icon: Icons.link_rounded,
                background: kSoftBlue,
                foreground: kSecondary,
              ),
              const Spacer(),
              Pill(
                text: '${_matched.length}/${_pairs.length} matched',
                background: kSoftGreen,
                foreground: kPrimaryDark,
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'اسحب كل كلمة إلى الصورة المطابقة',
            style: TextStyle(
              fontSize: 23,
              height: 1.2,
              fontWeight: FontWeight.w800,
              color: kInk,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'يمكنك أيضًا النقر على كلمة، ثم على صورتها.',
            style: TextStyle(
              fontSize: 12.5,
              color: kMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          Directionality(
            textDirection: TextDirection.ltr,
            child: Stack(
              key: _stackKey,
              children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      children: List.generate(_pairs.length, (index) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _imageTarget(index),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(width: 42),
                  Expanded(
                    child: Column(
                      children: List.generate(_pairs.length, (index) {
                        final pairIndex = _wordOrder[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: SizedBox(
                            height: 96,
                            child: Center(
                              child: _wordDraggable(pairIndex),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: _MatchLinePainter(_lines),
                  ),
                ),
              ),
            ],
          ),
          ),
          const SizedBox(height: 4),
          Text(
            done
                ? 'تمت مطابقة جميع الأزواج!'
                : 'Match all ${_pairs.length} pairs to continue.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: done ? kPrimary : kMuted,
            ),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: done ? () => widget.onComplete(!_hadWrong) : null,
            child: const Text('متابعة'),
          ),
        ],
      ),
    );
  }

  Widget _imageTarget(int index) {
    return DragTarget<int>(
      onWillAcceptWithDetails: (details) => !_matched.contains(index),
      onAcceptWithDetails: (details) => _tryMatch(index, details.data),
      builder: (context, candidate, rejected) {
        final highlighted = candidate.isNotEmpty;
        final matched = _matched.contains(index);
        final wrong = _wrongImage == index;
        final borderColor = matched
            ? kPrimary
            : (wrong ? kDanger : (highlighted ? kSecondary : kLine));
        return GestureDetector(
          onTap: () {
            final selected = _selectedWord;
            if (selected != null) _tryMatch(index, selected);
          },
          child: Container(
            key: _imageKeys[index],
            height: 96,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: borderColor,
                width: matched || highlighted || wrong ? 3 : 1.5,
              ),
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
                  LessonImage(lesson: _pairs[index]),
                  if (matched)
                    Positioned(
                      top: 7,
                      right: 7,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: const BoxDecoration(
                          color: kPrimary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          color: Colors.white,
                          size: 17,
                        ),
                      ),
                    ),
                  if (wrong)
                    Positioned(
                      top: 7,
                      right: 7,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: const BoxDecoration(
                          color: kDanger,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          color: Colors.white,
                          size: 17,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _wordDraggable(int pairIndex) {
    final matched = _matched.contains(pairIndex);
    final selected = _selectedWord == pairIndex;
    final card = _WordCard(
      key: _wordKeys[pairIndex],
      word: _pairs[pairIndex].word,
      matched: matched,
      selected: selected,
      onTap: matched
          ? null
          : () {
              setState(() {
                _selectedWord = selected ? null : pairIndex;
              });
            },
    );
    if (matched) return card;
    return Draggable<int>(
      data: pairIndex,
      feedback: Material(
        color: Colors.transparent,
        child: _WordCard(
          word: _pairs[pairIndex].word,
          matched: false,
          selected: true,
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.35,
        child: _WordCard(
          word: _pairs[pairIndex].word,
          matched: false,
          selected: selected,
        ),
      ),
      child: card,
    );
  }
}

class _WordCard extends StatelessWidget {
  final String word;
  final bool matched;
  final bool selected;
  final VoidCallback? onTap;

  const _WordCard({
    super.key,
    required this.word,
    required this.matched,
    required this.selected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final content = Container(
      constraints: const BoxConstraints(minWidth: 74, maxWidth: 128),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: matched
            ? kSoftGreen
            : (selected ? kSoftBlue : Colors.white),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: matched ? kPrimary : (selected ? kSecondary : kLine),
          width: matched || selected ? 2 : 1.2,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Flexible(
            child: Text(
              word,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.15,
                fontWeight: FontWeight.w800,
                color: matched ? kPrimaryDark : kInk,
              ),
            ),
          ),
          if (matched) ...[
            const SizedBox(width: 5),
            const Icon(Icons.check_circle_rounded, color: kPrimary, size: 16),
          ],
        ],
      ),
    );
    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: content,
      ),
    );
  }
}

class _MatchLinePainter extends CustomPainter {
  final List<_MatchLine> lines;
  _MatchLinePainter(this.lines);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = kPrimary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    for (final line in lines) {
      final path = Path()..moveTo(line.start.dx, line.start.dy);
      final dx = (line.end.dx - line.start.dx).abs() * 0.5;
      path.cubicTo(
        line.start.dx + dx,
        line.start.dy,
        line.end.dx - dx,
        line.end.dy,
        line.end.dx,
        line.end.dy,
      );
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MatchLinePainter old) => old.lines != lines;
}
