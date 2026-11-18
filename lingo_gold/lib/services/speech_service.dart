import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart';

class TtsService {
  TtsService._();
  static final TtsService instance = TtsService._();

  FlutterTts? _tts;
  bool _ready = false;

  Future<void> _init() async {
    try {
      final tts = FlutterTts();
      await tts.setLanguage('en-US');
      await tts.setSpeechRate(0.45);
      await tts.setPitch(1.0);
      await tts.setVolume(1.0);

      // Pick an English voice explicitly so the device never falls back to an
      // Arabic (or other) voice. Prefer en-US, then en-GB, then any en-*.
      try {
        final voices = await tts.getVoices;
        if (voices is List && voices.isNotEmpty) {
          Map<String, String>? chosen;
          for (final candidate in voices) {
            if (candidate is! Map) continue;
            final rawLocale = (candidate['locale'] ?? '').toString();
            final norm = rawLocale.toLowerCase().replaceAll(RegExp(r'[^a-z]'), '');
            if (!norm.startsWith('en')) continue;
            if (chosen == null) chosen = _voiceMap(candidate);
            if (norm == 'enus') {
              chosen = _voiceMap(candidate);
              break;
            }
            if (norm == 'engb' && chosen != null) {
              // Prefer en-GB over other en-* only if en-US is unavailable.
              final chosenNorm = (chosen['locale'] ?? '')
                  .toLowerCase()
                  .replaceAll(RegExp(r'[^a-z]'), '');
              if (!chosenNorm.startsWith('enus')) {
                chosen = _voiceMap(candidate);
              }
            }
          }
          if (chosen != null) {
            await tts.setVoice(chosen);
          }
        }
      } catch (_) {
        // Voice enumeration is not supported on every platform; fall back to
        // the language setting above.
      }

      _tts = tts;
      _ready = true;
    } catch (_) {
      _ready = false;
    }
  }

  Map<String, String> _voiceMap(Map candidate) => {
        'name': (candidate['name'] ?? '').toString(),
        'locale': (candidate['locale'] ?? '').toString(),
      };

  Future<void> speak(String text) async {
    if (!_ready) await _init();
    if (!_ready || _tts == null) return;
    try {
      await _tts!.stop();
      await _tts!.speak(text);
    } catch (_) {
      // TTS is unavailable on this device; the visual lesson still works.
    }
  }

  Future<void> stop() async {
    try {
      await _tts?.stop();
    } catch (_) {}
  }
}

class SpeechService {
  SpeechService._();
  static final SpeechService instance = SpeechService._();

  final SpeechToText _speech = SpeechToText();
  bool _available = false;
  bool _initialized = false;

  bool get isAvailable => _available;
  bool get isListening => _speech.isListening;

  /// Initializes speech recognition. Retries a few times on failure.
  Future<bool> init({bool force = false}) async {
    if (_initialized && !force && _available) return _available;
    if (force) {
      _initialized = false;
      _available = false;
    }
    if (_initialized && _available) return _available;
    _initialized = true;
    try {
      _available = await _speech.initialize(
        onStatus: (_) {},
        onError: (_) {},
        debugLogging: false,
      );
    } catch (_) {
      _available = false;
      _initialized = false;
    }
    return _available;
  }

  /// Shared English-only listener used by EVERY speaking lesson.
  ///
  /// ALWAYS uses en-US (or en-GB fallback). NEVER Arabic or device default.
  static Future<void> listenEnglish(Function(String text) onResult) async {
    final speech = SpeechToText();
    var available = await speech.initialize(
      onStatus: (_) {},
      onError: (_) {},
      debugLogging: false,
    );
    if (!available) {
      // Retry once.
      available = await speech.initialize(
        onStatus: (_) {},
        onError: (_) {},
        debugLogging: false,
      );
    }
    if (!available) return;

    // Pick an English locale: prefer en-US, then en-GB, then any en-*.
    String localeId = 'en-US';
    try {
      final locales = await speech.locales();
      final hasEnUs = locales.any((l) => l.localeId == 'en-US');
      final hasEnGb = locales.any((l) => l.localeId == 'en-GB');
      if (!hasEnUs) {
        if (hasEnGb) {
          localeId = 'en-GB';
        } else {
          final en = locales
              .where((l) => l.localeId.toLowerCase().startsWith('en'))
              .toList();
          if (en.isNotEmpty) {
            localeId = en.first.localeId;
          } else if (locales.isNotEmpty) {
            // Last resort: still never Arabic; pick first non-arabic.
            final nonAr = locales
                .where((l) => !l.localeId.toLowerCase().startsWith('ar'))
                .toList();
            if (nonAr.isNotEmpty) localeId = nonAr.first.localeId;
          }
        }
      }
    } catch (_) {
      localeId = 'en-US';
    }

    // Guard: never Arabic.
    if (localeId.toLowerCase().startsWith('ar')) {
      localeId = 'en-US';
    }

    var gotResult = false;
    try {
      await speech.listen(
        onResult: (result) {
          if (result.finalResult) {
            gotResult = true;
            onResult(result.recognizedWords);
          }
        },
        localeId: localeId,
        listenFor: const Duration(seconds: 15),
        pauseFor: const Duration(seconds: 4),
        partialResults: true,
        listenMode: ListenMode.confirmation,
      );
    } catch (_) {
      if (!gotResult) onResult('');
      return;
    }
    if (!gotResult) {
      onResult('');
    }
  }
}
