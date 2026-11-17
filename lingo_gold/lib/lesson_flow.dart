import 'dart:async';

import 'package:flutter/material.dart';

import 'coloring_screen.dart';
import 'course.dart';
import 'services/speech_service.dart';

const Color kBlue = Color(0xFF2563EB);
const Color kBlueSoft = Color(0xFFEFF6FF);
const Color kBlueLine = Color(0xFFBFDBFE);
const Color kGreen = Color(0xFF16A34A);
const Color kGreenSoft = Color(0xFFF0FDF4);
const Color kRed = Color(0xFFDC2626);
const Color kRedSoft = Color(0xFFFEF2F2);
const Color kInk = Color(0xFF111827);
const Color kMuted = Color(0xFF6B7280);
const Color kLine = Color(0xFFE5E7EB);

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
  int _window = 0; // 0..4 activities, 5 coloring
  int _level = 0; // 0..2
  int _page = 0; // 0..4 coloring pages
  int _selected = -1;
  bool _checked = false;
  bool? _correct;
  bool _showReward = false;

  Activity? _activity;
  List<int> _rightOrder = [];

  int? _matchLeft;
  int? _matchRight;
  bool _matchWrong = false;
  final Set<int> _matched = {};

  Timer? _rewardTimer;

  @override
  void initState() {
    super.initState();
    _lessonId = widget.startLessonId.clamp(1, widget.totalLessons);
    _loadActivity();
    WidgetsBinding.instance.addPostFrameCallback((_) => _speakIfListening());
  }

  @override
  void dispose() {
    _rewardTimer?.cancel();
    super.dispose();
  }

  ActivityType _typeForWindow(int w) {
    switch (w) {
      case 0:
        return ActivityType.listening;
      case 1:
        return ActivityType.choose;
      case 2:
        return ActivityType.writing;
      case 3:
        return ActivityType.smartChoose;
      default:
        return ActivityType.matching;
    }
  }

  void _loadActivity() {
    if (_window >= 5) {
      _activity = null;
      _rightOrder = [];
      return;
    }
    final lesson = lessonById(_lessonId);
    final type = _typeForWindow(_window);
    final d = Difficulty.values[_level];
    final a = buildActivity(lesson, type, d);
    _activity = a;
    if (a.pairs != null) {
      _rightOrder = List.generate(a.pairs!.length, (i) => i)..shuffle();
    } else {
      _rightOrder = [];
    }
  }

  void _speakIfListening() {
    final a = _activity;
    if (a != null && a.type == ActivityType.listening && a.speakText != null) {
      TtsService.instance.speak(a.speakText!);
    }
  }

  void _resetInteraction() {
    _selected = -1;
    _checked = false;
    _correct = null;
    _matched.clear();
    _matchLeft = null;
    _matchRight = null;
    _matchWrong = false;
  }

  void _checkAnswer() {
    final a = _activity;
    if (a == null || _selected < 0) return;
    final isCorrect = a.options[_selected].isCorrect;
    setState(() {
      _checked = true;
      _correct = isCorrect;
    });
  }

  void _advance() {
    setState(() {
      if (_window >= 5) {
        if (_page < 4) {
          _page++;
        } else {
          _completeLesson();
          return;
        }
      } else {
        if (_level < 2) {
          _level++;
        } else {
          _level = 0;
          _window++;
        }
        _resetInteraction();
        _loadActivity();
      }
    });
    _speakIfListening();
  }

  void _completeLesson() {
    widget.onLessonComplete?.call(_lessonId);
    setState(() => _showReward = true);
    _rewardTimer?.cancel();
    if (_lessonId >= widget.totalLessons) {
      _rewardTimer = Timer(const Duration(milliseconds: 2200), () {
        if (!mounted) return;
        _showCongrats();
      });
      return;
    }
    _rewardTimer = Timer(const Duration(milliseconds: 2000), () {
      if (!mounted) return;
      setState(() {
        _showReward = false;
        _lessonId++;
        _window = 0;
        _level = 0;
        _page = 0;
        _resetInteraction();
        _loadActivity();
      });
      _speakIfListening();
    });
  }

  void _showCongrats() {
    if (!mounted) return;
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('مبروك! 🎉'),
        content: const Text(
          'كملت 100 درس! أنت بطل حقيقي!',
          style: TextStyle(fontSize: 18),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop();
            },
            child: const Text('الرئيسية'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lesson = lessonById(_lessonId);
    final section = sectionOf(lesson);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _topBar(lesson, section),
                _progressStrip(),
                Expanded(child: _body(lesson)),
              ],
            ),
            if (_showReward) _rewardOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _topBar(CourseLesson lesson, CourseSection section) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 6, 8, 2),
      child: Row(
        children: [
          _roundIcon(
            Icons.close_rounded,
            'خروج',
            () => Navigator.of(context).pop(),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  'الدرس ${lesson.id} من ${widget.totalLessons}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: kInk,
                  ),
                ),
                Text(
                  '${section.nameAr} • ${lesson.word}',
                  textDirection: TextDirection.ltr,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: kMuted,
                  ),
                ),
              ],
            ),
          ),
          _roundIcon(
            Icons.home_rounded,
            'الرئيسية',
            () {
              Navigator.of(context).pop();
              widget.onExit?.call();
            },
          ),
        ],
      ),
    );
  }

  Widget _roundIcon(IconData icon, String tip, VoidCallback onTap) {
    return Tooltip(
      message: tip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: kBlueSoft,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: kBlueLine),
          ),
          child: Icon(icon, color: kBlue, size: 22),
        ),
      ),
    );
  }

  Widget _progressStrip() {
    final windowFraction = _window >= 5 ? _page / 5.0 : _level / 3.0;
    final value = ((_window + windowFraction) / 6).clamp(0.0, 1.0);
    final label = _window >= 5
        ? 'التلوين • الصورة ${_page + 1} من 5'
        : '${activityAr[_window]} • ${difficultyAr[_level]}';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: kBlue,
                ),
              ),
              Text(
                'النافذة ${(_window + 1).clamp(1, 6)} من 6',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: kMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: value,
              minHeight: 10,
              backgroundColor: const Color(0xFFDBEAFE),
              valueColor: const AlwaysStoppedAnimation<Color>(kBlue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _body(CourseLesson lesson) {
    if (_window >= 5) return _coloringBody(lesson);
    final a = _activity;
    if (a == null) return const SizedBox.shrink();
    if (a.type == ActivityType.matching) return _matchingBody(a);
    return _choiceBody(a);
  }

  // ================= CHOICE / LISTENING / WRITING / SMART =================

  Widget _choiceBody(Activity a) {
    final isListening = a.type == ActivityType.listening;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: Column(
            children: [
              Text(
                a.instructionAr,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: kMuted,
                ),
              ),
              const SizedBox(height: 6),
              if (isListening)
                _listenCard(a)
              else
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Text(
                    a.questionEn,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: kInk,
                    ),
                  ),
                ),
              if (!isListening && a.speakText != null)
                TextButton.icon(
                  onPressed: () => TtsService.instance.speak(a.speakText!),
                  icon: const Icon(Icons.volume_up_rounded,
                      size: 18, color: kBlue),
                  label: const Text(
                    'إعادة الصوت',
                    style: TextStyle(
                      color: kBlue,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GridView.count(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.95,
              children: [
                for (var i = 0; i < a.options.length; i++)
                  _optionCard(a.options[i], i),
              ],
            ),
          ),
        ),
        _bottomAction(a),
      ],
    );
  }

  Widget _listenCard(Activity a) {
    return GestureDetector(
      onTap: () => TtsService.instance.speak(a.speakText ?? ''),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
        decoration: BoxDecoration(
          color: kBlue,
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [
            BoxShadow(
              color: Color(0x332563EB),
              blurRadius: 16,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.volume_up_rounded, color: Colors.white, size: 34),
            SizedBox(width: 10),
            Text(
              'اسمع',
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _optionCard(ActivityOption o, int index) {
    final selected = _selected == index;
    var border = kLine;
    var bg = Colors.white;
    if (_checked) {
      if (o.isCorrect) {
        border = kGreen;
        bg = kGreenSoft;
      } else if (selected) {
        border = kRed;
        bg = kRedSoft;
      }
    } else if (selected) {
      border = kBlue;
      bg = kBlueSoft;
    }
    return GestureDetector(
      onTap: _checked ? null : () => setState(() => _selected = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: border, width: 3),
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          children: [
            Expanded(child: Center(child: _optionVisual(o))),
            if (o.label.isNotEmpty && o.emoji.isNotEmpty)
              Text(
                o.label,
                textDirection: TextDirection.ltr,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: kInk,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _optionVisual(ActivityOption o) {
    if (o.emoji.isEmpty) {
      return Text(
        o.label,
        style: const TextStyle(
          fontSize: 44,
          fontWeight: FontWeight.w900,
          color: kBlue,
        ),
      );
    }
    final emojis = List.filled(o.count.clamp(1, 6), o.emoji);
    Widget core;
    if (o.tint != null) {
      core = Container(
        width: 74,
        height: 74,
        decoration: BoxDecoration(
          color: o.tint,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33000000),
              blurRadius: 6,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: Text(o.emoji, style: const TextStyle(fontSize: 34)),
        ),
      );
    } else {
      core = Wrap(
        alignment: WrapAlignment.center,
        spacing: 2,
        runSpacing: 2,
        children: [
          for (final e in emojis)
            Text(e, style: const TextStyle(fontSize: 34)),
        ],
      );
    }
    if (o.badge != null) {
      return Stack(
        clipBehavior: Clip.none,
        children: [
          core,
          Positioned(
            right: -6,
            bottom: -6,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Text(o.badge!, style: const TextStyle(fontSize: 20)),
            ),
          ),
        ],
      );
    }
    return core;
  }

  Widget _bottomAction(Activity a) {
    if (!_checked) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _selected >= 0 ? _checkAnswer : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: kBlue,
              disabledBackgroundColor: const Color(0xFFE5E7EB),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
            child: Text(
              _selected >= 0 ? 'تحقق' : 'اختر إجابة',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      );
    }
    final ok = _correct == true;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: ok ? kGreenSoft : kRedSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ok ? kGreen : kRed),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  ok ? Icons.check_circle_rounded : Icons.cancel_rounded,
                  color: ok ? kGreen : kRed,
                ),
                const SizedBox(width: 8),
                Text(
                  ok ? 'إجابة صحيحة! 🎉' : 'إجابة خاطئة، الإجابة الصحيحة بالأخضر',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: ok ? kGreen : kRed,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _advance,
              style: ElevatedButton.styleFrom(
                backgroundColor: kBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
              child: const Text(
                'التالي',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ================= MATCHING =================

  Widget _matchingBody(Activity a) {
    final pairs = a.pairs ?? const <MatchPair>[];
    final allMatched = _matched.length == pairs.length;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: Column(
            children: [
              Text(
                a.instructionAr,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: kMuted,
                ),
              ),
              const SizedBox(height: 4),
              Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  a.questionEn,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
              ),
              TextButton.icon(
                onPressed: () => TtsService.instance
                    .speak(lessonById(_lessonId).word),
                icon: const Icon(Icons.volume_up_rounded,
                    size: 18, color: kBlue),
                label: const Text(
                  'إعادة الصوت',
                  style: TextStyle(
                    color: kBlue,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                Expanded(
                  child: ListView.separated(
                    itemCount: pairs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _matchLeftCard(pairs[i], i),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ListView.separated(
                    itemCount: _rightOrder.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) {
                      final original = _rightOrder[i];
                      return _matchRightCard(pairs[original], original);
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        if (allMatched)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            child: SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _advance,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'التالي',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                ),
              ),
            ),
          )
        else
          const SizedBox(height: 16),
      ],
    );
  }

  Widget _matchLeftCard(MatchPair p, int index) {
    final matched = _matched.contains(index);
    final selected = _matchLeft == index;
    final wrong = _matchWrong && selected;
    return GestureDetector(
      onTap: matched
          ? null
          : () => setState(() {
                _matchLeft = index;
                _matchWrong = false;
              }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: matched
              ? kGreenSoft
              : wrong
                  ? kRedSoft
                  : selected
                      ? kBlueSoft
                      : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: matched
                ? kGreen
                : wrong
                    ? kRed
                    : selected
                        ? kBlue
                        : kLine,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            if (matched)
              const Icon(Icons.check_circle_rounded, color: kGreen, size: 20),
            const SizedBox(width: 4),
            Expanded(
              child: Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  p.left,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: kInk,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _matchRightCard(MatchPair p, int originalIndex) {
    final matched = _matched.contains(originalIndex);
    final selected = _matchRight == originalIndex;
    final wrong = _matchWrong && selected;
    return GestureDetector(
      onTap: matched
          ? null
          : () => _tryMatch(originalIndex),
      child: Container(
        height: 84,
        decoration: BoxDecoration(
          color: matched
              ? kGreenSoft
              : wrong
                  ? kRedSoft
                  : selected
                      ? kBlueSoft
                      : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: matched
                ? kGreen
                : wrong
                    ? kRed
                    : selected
                        ? kBlue
                        : kLine,
            width: 2,
          ),
        ),
        child: Center(
          child: _optionVisual(ActivityOption(
            emoji: p.emoji,
            label: p.label,
            tint: p.tint,
            badge: p.badge,
            count: p.count,
          )),
        ),
      ),
    );
  }

  void _tryMatch(int originalIndex) {
    final left = _matchLeft;
    if (left == null) return;
    setState(() {
      _matchRight = originalIndex;
      if (left == originalIndex) {
        _matched.add(left);
        _matchLeft = null;
        _matchRight = null;
        _matchWrong = false;
      } else {
        _matchWrong = true;
      }
    });
    if (_matched.length == (_activity?.pairs?.length ?? 0)) {
      // all matched
    }
  }

  // ================= COLORING =================

  Widget _coloringBody(CourseLesson lesson) {
    final pages = coloringPagesFor(lesson.id);
    final prompts = coloringPromptsFor(lesson);
    final page = pages[_page.clamp(0, 4)];
    final prompt = prompts[_page.clamp(0, 4)];
    return ColoringCanvas(
      key: ValueKey('${lesson.id}_$_page'),
      imageAsset: page,
      prompt: prompt,
      onDone: _advance,
    );
  }

  // ================= REWARD =================

  Widget _rewardOverlay() {
    final isLast = _lessonId >= widget.totalLessons;
    return Positioned.fill(
      child: Container(
        color: const Color(0x99000000),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 34, vertical: 28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('⭐', style: TextStyle(fontSize: 76)),
                const SizedBox(height: 6),
                const Text(
                  'أحسنت! 🎉',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: kBlue,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  '+20 XP',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: kGreen,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  isLast ? 'مبروك! كملت 100 درس 🎉' : 'الدرس التالي...',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: kMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
