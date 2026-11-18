import 'dart:async';

import 'package:flutter/material.dart';

import 'data.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'services/speech_service.dart';
import 'user_profile.dart';
import 'theme.dart';
import 'widgets.dart';

class SpeakingStep extends StatefulWidget {
  final Lesson lesson;
  final void Function(bool correct, int score) onComplete;
  final bool showTranslation;

  const SpeakingStep({
    super.key,
    required this.lesson,
    required this.onComplete,
    this.showTranslation = true,
  });

  @override
  State<SpeakingStep> createState() => _SpeakingStepState();
}

class _SpeakingStepState extends State<SpeakingStep> {
  final SpeechToText _speech = SpeechToText();
  bool _initializing = true;
  bool _speechAvailable = false;
  bool _listening = false;
  bool _hasSpoken = false;
  String _recognized = '';
  int? _score;
  bool _scored = false;
  Timer? _timer;

  String get _sentence => widget.lesson.sentence.replaceAll('___', widget.lesson.word);
  String get _spokenSentence => widget.lesson.spokenText.replaceAll('___', widget.lesson.word);

  @override
  void initState() {
    super.initState();
    _prepareSpeech();
  }

  Future<void> _prepareSpeech() async {
    var available = false;
    for (var i = 0; i < 3 && !available; i++) {
      try {
        available = await _speech.initialize(
          onStatus: (_) {},
          onError: (_) {},
          debugLogging: false,
        );
      } catch (_) {
        available = false;
      }
      if (!available) {
        await Future<void>.delayed(const Duration(milliseconds: 400));
      }
    }
    if (!mounted) return;
    setState(() {
      _speechAvailable = available;
      _initializing = false;
    });
  }



  Future<void> _speak() => TtsService.instance.speak(_spokenSentence);

  Future<void> _startListening() async {
    if (_listening) {
      await _finishListening();
      return;
    }
    if (_initializing) return;
    if (!_speechAvailable) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'الميكروفون / التعرف على الصوت غير متاح. تحقق من الإذن أو تخطَّ.',
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() {
      _listening = true;
      _hasSpoken = false;
      _recognized = '';
      _score = null;
      _scored = false;
    });
    _timer?.cancel();
    _timer = Timer(const Duration(seconds: 16), () {
      if (mounted && _listening) _finishListening();
    });
    try {
      await _speech.listen(
        onResult: (result) {
          if (!mounted) return;
          if (result.finalResult) {
            final heardText = result.recognizedWords;
            setState(() {
              _recognized = heardText;
              _hasSpoken = true;
              _listening = false;
            });
            _finishListening();
          }
        },
        localeId: 'en-US',
        listenFor: const Duration(seconds: 15),
        pauseFor: const Duration(seconds: 4),
        partialResults: false,
        listenMode: ListenMode.confirmation,
      );
    } catch (_) {
      if (mounted) _finishListening();
    }
  }

  Future<void> _finishListening() async {
    _timer?.cancel();
    if (_scored) return;
    if (!mounted) return;
    _scored = true;
    final score = _recognized.trim().isEmpty
        ? 0
        : _pronunciationScore(_sentence, _recognized, 0);
    setState(() {
      _listening = false;
      _hasSpoken = true;
      _score = score;
    });
  }

  int _pronunciationScore(String target, String recognized, double confidence) {
    String normalize(String value) => value
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z ]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    final normalizedTarget = normalize(target);
    final normalizedRecognized = normalize(recognized);

    if (normalizedRecognized.isEmpty) return 0;

    final targetWords = normalizedTarget
        .split(' ')
        .where((word) => word.isNotEmpty)
        .toList();
    final spokenWords = normalizedRecognized
        .split(' ')
        .where((word) => word.isNotEmpty)
        .toList();

    if (targetWords.isEmpty) return 0;

    // If the recognized text contains the target, perfect.
    if (normalizedRecognized.contains(normalizedTarget)) return 100;

    // Fuzzy word matching: edit distance up to 2 (handles accents/typos).
    var matches = 0;
    for (final targetWord in targetWords) {
      var found = false;
      for (final spokenWord in spokenWords) {
        if (spokenWord == targetWord ||
            _editDistance(spokenWord, targetWord) <= 2) {
          found = true;
          break;
        }
      }
      if (!found) {
        for (final spokenWord in spokenWords) {
          if (spokenWord.contains(targetWord) ||
              targetWord.contains(spokenWord)) {
            found = true;
            break;
          }
        }
      }
      if (found) matches++;
    }

    final ratio = targetWords.isEmpty ? 0.0 : matches / targetWords.length;
    // 3/3 (or all) = 100%, 2/3 = 80% (pass), 1/3 = 40% (fail).
    if (ratio >= 0.99) return 100;
    if (ratio >= 0.6) return 80;
    if (matches >= 1) return 40;
    // Confidence boost.
    if (confidence >= 0.5) return 100;
    // Fallback overall similarity.
    final similarity = _stringSimilarity(normalizedTarget, normalizedRecognized);
    if (similarity >= 0.5) return 80;
    return 0;
  }

  double _stringSimilarity(String a, String b) {
    if (a.isEmpty || b.isEmpty) return 0;
    final setA = a.split('').toSet();
    final setB = b.split('').toSet();
    final intersection = setA.intersection(setB).length;
    final union = setA.union(setB).length;
    return union == 0 ? 0 : intersection / union;
  }

  int _editDistance(String a, String b) {
    if (a == b) return 0;
    if (a.isEmpty) return b.length;
    if (b.isEmpty) return a.length;
    final m = a.length;
    final n = b.length;
    final dp = List.generate(m + 1, (_) => List.filled(n + 1, 0));
    for (var i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (var j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        final cost = a[i - 1] == b[j - 1] ? 0 : 1;
        final deletion = dp[i - 1][j] + 1;
        final insertion = dp[i][j - 1] + 1;
        final substitution = dp[i - 1][j - 1] + cost;
        dp[i][j] = [deletion, insertion, substitution]
            .reduce((x, y) => x < y ? x : y);
      }
    }
    return dp[m][n];
  }

  @override
  Widget build(BuildContext context) {
    final passed = (_score ?? 0) >= 80;
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
                  text: 'التحدث',
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
                    icon: const Icon(
                      Icons.volume_up_rounded,
                      color: kSecondary,
                      size: 24,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SoftCard(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'قل هذه الجملة',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: kMuted,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _sentence,
                        style: const TextStyle(
                          fontSize: 23,
                          height: 1.2,
                          fontWeight: FontWeight.w800,
                          color: kInk,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'اضغط على السماعة للاستماع ثم كرر.',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: kMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _speak,
                  icon: const Icon(
                    Icons.volume_up_rounded,
                    color: kSecondary,
                    size: 26,
                  ),
                ),
              ],
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
          const SizedBox(height: 12),
          SoftCard(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Column(
              children: [
                Waveform(
                  active: _listening,
                  color: _listening ? kSecondary : kMuted,
                  height: 52,
                ),
                const SizedBox(height: 2),
                Text(
                  _listening
                      ? 'جارٍ الاستماع... اضغط للميكروفون للإيقاف'
                      : 'اضغط على الميكروفون وقلها',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _listening ? kSecondary : kMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Center(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: _initializing ? null : _startListening,
                child: Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: _listening
                          ? const [kDanger, Color(0xFFB4232A)]
                          : const [kSecondary, Color(0xFF1457B8)],
                    ),
                    border: Border.all(color: Colors.white, width: 4),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x331E6FDB),
                        blurRadius: 20,
                        offset: Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Icon(
                    _listening ? Icons.stop_rounded : Icons.mic_rounded,
                    color: Colors.white,
                    size: 34,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: _initializing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(
                    _listening
                        ? 'Listening... tap to stop'
                        : 'اضغط على الميكروفون وقلها',
                    style: const TextStyle(
                      fontSize: 12,
                      color: kMuted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
          ),
          if (!_speechAvailable && !_initializing) ...[
            const SizedBox(height: 8),
            const Text(
              'التعرف على الكلام غير متاح على هذا الجهاز. يمكنك الاستماع والتخطي.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: kMuted, height: 1.35),
            ),
          ],
          if (_hasSpoken) ...[
            const SizedBox(height: 14),
            _ScorePanel(
              passed: passed,
              score: _score!,
              recognized: _recognized,
              onRepeat: passed ? _startListening : _speak,
              onContinue: () => widget.onComplete(true, _score!),
              onTryAgain: _startListening,
              userName: UserProfile.instance.name.value,
            ),
          ],
          const SizedBox(height: 4),
          TextButton(
            onPressed: () => widget.onComplete(false, _score ?? 0),
            style: TextButton.styleFrom(foregroundColor: kMuted),
            child: const Text('تخطي'),
          ),
        ],
      ),
    );
  }
}

class _ScorePanel extends StatelessWidget {
  final bool passed;
  final int score;
  final String recognized;
  final VoidCallback onRepeat;
  final VoidCallback onContinue;
  final VoidCallback onTryAgain;
  final String userName;

  const _ScorePanel({
    required this.passed,
    required this.score,
    required this.recognized,
    required this.onRepeat,
    required this.onContinue,
    required this.onTryAgain,
    required this.userName,
  });

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      color: passed ? kSoftGreen : kSoftOrange,
      border: Border.all(
        color: passed
            ? kPrimary.withValues(alpha: 0.35)
            : const Color(0xFFF5B301).withValues(alpha: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleIcon(
                icon: passed ? Icons.check_rounded : Icons.info_outline_rounded,
                background: passed ? kPrimary : const Color(0xFFF5B301),
                foreground: Colors.white,
                size: 38,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      passed ? 'أحسنت يا $userName! $score%' : 'حاول مجدداً',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: kInk,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                       recognized.isEmpty
                           ? 'قلت: (لم يُلتقط شيء)'
                           : 'You said: "$recognized"',
                      style: const TextStyle(
                        fontSize: 11.5,
                        height: 1.35,
                        color: kMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'النتيجة: $score%',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: kPrimaryDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (passed)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onRepeat,
                    icon: const Icon(Icons.replay_rounded, size: 19),
                    label: const Text('إعادة'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: onContinue,
                    child: const Text('متابعة'),
                  ),
                ),
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onRepeat,
                    icon: const Icon(Icons.volume_up_rounded, size: 19),
                    label: const Text('إعادة'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: onTryAgain,
                    child: const Text('حاول مجدداً'),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
