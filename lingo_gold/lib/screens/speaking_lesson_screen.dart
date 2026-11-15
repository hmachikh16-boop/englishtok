import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_tts/flutter_tts.dart';

class SpeakingLessonScreen extends StatefulWidget {
  final String sentence;
  final String imagePath;
  final String lessonTitle;
  final int step;
  final int totalSteps;
  final int score;
  final int coins;

  const SpeakingLessonScreen({
    super.key,
    required this.sentence,
    required this.imagePath,
    required this.lessonTitle,
    this.step = 1,
    this.totalSteps = 5,
    this.score = 0,
    this.coins = 1280,
  });

  @override
  State<SpeakingLessonScreen> createState() => _SpeakingLessonScreenState();
}

class _SpeakingLessonScreenState extends State<SpeakingLessonScreen> {
  final SpeechToText _speech = SpeechToText();
  final FlutterTts _tts = FlutterTts();

  bool _isListening = false;
  bool _hasSpoken = false;
  String _heard = "";
  int _scorePercent = 0;
  bool _isCorrect = false;

  String normalize(String t) {
    return t
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z ]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  int calculateScore(String heard, String expected) {
    String h = normalize(heard);
    String e = normalize(expected);
    if (h.isEmpty) return 0;
    if (h == e) return 100;
    List<String> hWords = h.split(' ');
    List<String> eWords = e.split(' ');
    int matched = 0;
    for (var w in eWords) {
      if (hWords.contains(w)) matched++;
    }
    return ((matched / eWords.length) * 100).round();
  }

  Future<void> _speakSentence() async {
    await _tts.setLanguage("en-US");
    await _tts.setSpeechRate(0.5);
    await _tts.speak(widget.sentence);
  }

  Future<void> _listen() async {
    bool available = await _speech.initialize();
    if (!available) return;
    setState(() {
      _isListening = true;
      _hasSpoken = false;
    });
    await _speech.listen(
      onResult: (result) {
        if (result.finalResult) {
          String heardText = result.recognizedWords;
          int s = calculateScore(heardText, widget.sentence);
          setState(() {
            _heard = heardText;
            _scorePercent = s;
            _isCorrect = s >= 70;
            _hasSpoken = true;
            _isListening = false;
          });
          debugPrint("HEARD: $_heard | EXPECTED: ${widget.sentence} | SCORE: $_scorePercent");
        }
      },
      localeId: "en-US",
      listenFor: const Duration(seconds: 15),
      pauseFor: const Duration(seconds: 4),
      partialResults: false,
      cancelOnError: false,
      listenMode: ListenMode.confirmation,
    );
  }

  void _reset() {
    setState(() {
      _hasSpoken = false;
      _heard = "";
      _scorePercent = 0;
      _isCorrect = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("🏆 ", style: TextStyle(fontSize: 24)),
            Text(
              "LINGO GOLD",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: Colors.amber.shade700,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Row(
              children: [
                const Text("🪙", style: TextStyle(fontSize: 20)),
                Text(" ${widget.coins}",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.black)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.lessonTitle,
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color: Colors.blue.shade100,
                          borderRadius: BorderRadius.circular(20)),
                      child: Text("Step ${widget.step} of ${widget.totalSteps}",
                          style: const TextStyle(color: Colors.blue)),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(20)),
                      child: Text("Score ${widget.score}/${widget.totalSteps}"),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.asset(
                    widget.imagePath,
                    height: 220,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                        color: Colors.blue,
                        borderRadius: BorderRadius.circular(20)),
                    child: const Row(
                      children: [
                        Icon(Icons.mic, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text("التحدث",
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                      color: Colors.grey.withOpacity(0.15),
                      blurRadius: 10,
                      spreadRadius: 2)
                ],
              ),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("قل هذه الجملة",
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('"${widget.sentence}"',
                                textDirection: TextDirection.ltr,
                                style: const TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            const Text(
                                "• اضغط على السماعة للاستماع ثم كرر.",
                                style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: _speakSentence,
                        icon: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              shape: BoxShape.circle),
                          child: const Icon(Icons.volume_up,
                              color: Colors.blue, size: 28),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Image.asset("assets/wave.png",
                      height: 40, errorBuilder: (c, e, s) {
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                          30,
                          (i) => Container(
                                width: 3,
                                height: 10 + (i % 5) * 6.0,
                                margin:
                                    const EdgeInsets.symmetric(horizontal: 2),
                                color: Colors.blue,
                              )),
                    );
                  }),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: _listen,
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        color: _isListening ? Colors.red : Colors.blue,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                              color: Colors.blue.withOpacity(0.3),
                              blurRadius: 10,
                              spreadRadius: 2)
                        ],
                      ),
                      child: const Icon(Icons.mic,
                          color: Colors.white, size: 34),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _isListening
                        ? "جارٍ الاستماع... تحدث الآن"
                        : "اضغط على الميكروفون وقلها",
                    style: const TextStyle(
                        color: Colors.blue, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_hasSpoken)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _isCorrect
                      ? Colors.green.shade50
                      : Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: _isCorrect ? Colors.green : Colors.orange),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                            _isCorrect
                                ? Icons.check_circle
                                : Icons.refresh,
                            color:
                                _isCorrect ? Colors.green : Colors.orange,
                            size: 28),
                        const SizedBox(width: 8),
                        Text(
                          _isCorrect ? "أحسنت! 🎉" : "حاول مجدداً",
                          style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('You said: "$_heard"',
                        style: const TextStyle(fontSize: 16)),
                    const SizedBox(height: 4),
                    Text("النتيجة: $_scorePercent%",
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _reset,
                            icon: const Icon(Icons.refresh),
                            label: const Text("إعادة"),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isCorrect
                                  ? Colors.green
                                  : Colors.orange,
                            ),
                            child: Text(_isCorrect
                                ? "متابعة →"
                                : "حاول مجدداً"),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
