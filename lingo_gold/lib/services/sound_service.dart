import 'package:flutter/widgets.dart';
import 'package:audioplayers/audioplayers.dart';

/// Lightweight sound-effect player for correct / wrong / lesson-complete cues.
class SoundService {
  SoundService._();
  static final SoundService instance = SoundService._();

  AudioPlayer? _player;
  bool _muted = false;
  bool _disabled = false;

  bool get _isTestEnvironment {
    try {
      return WidgetsBinding.instance.runtimeType.toString().contains('Test');
    } catch (_) {
      return false;
    }
  }

  bool get muted => _muted;
  set muted(bool value) => _muted = value;

  Future<void> playCorrect() => _play('audio/correct.wav');
  Future<void> playError() => _play('audio/error.wav');
  Future<void> playComplete() => _play('audio/complete.wav');

  Future<void> _play(String asset) async {
    if (_muted || _disabled || _isTestEnvironment) return;
    try {
      _player ??= AudioPlayer();
      await _player!.stop();
      await _player!.play(AssetSource(asset));
    } catch (_) {
      _disabled = true;
    }
  }

  Future<void> stop() async {
    try {
      await _player?.stop();
    } catch (_) {}
  }
}

