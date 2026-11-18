import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

import 'lesson_coloring_pages.dart';
import 'services/sound_service.dart';
import 'services/speech_service.dart';
import 'theme.dart';
import 'widgets.dart';

/// Guided tap-to-fill coloring step used at the end of lessons 1–10.
///
/// The learner hears an English instruction (for example
/// "Color the boy's shirt blue."), taps a color to hear its English name, then
/// taps the matching part of the picture. The picture is one of the
/// professional line-art pages that already ship in assets/coloring. A bitmap
/// flood fill colors the whole white area under the finger while keeping the
/// black outlines. When all guided parts are done the "متابعة" button becomes
/// available.
class LessonColoringStep extends StatefulWidget {
  final int lessonIndex;
  final VoidCallback onComplete;

  const LessonColoringStep({
    super.key,
    required this.lessonIndex,
    required this.onComplete,
  });

  @override
  State<LessonColoringStep> createState() => _LessonColoringStepState();
}

class _UndoEntry {
  final Uint8List pixels;
  final int taskIndex;
  final bool completed;

  const _UndoEntry(this.pixels, this.taskIndex, this.completed);
}

class _LessonColoringStepState extends State<LessonColoringStep> {
  static const _palette = <(Color, String)>[
    (kColoringRed, 'Red'),
    (kColoringBlue, 'Blue'),
    (kColoringGreen, 'Green'),
    (kColoringYellow, 'Yellow'),
    (kColoringOrange, 'Orange'),
    (kColoringPink, 'Pink'),
  ];

  late final LessonColoringData _data;
  final List<_UndoEntry> _undoStack = [];

  ui.Image? _image;
  Uint8List? _pixels;
  Uint8List? _originalPixels;
  int _imageWidth = 0;
  int _imageHeight = 0;
  bool _loading = true;
  String? _loadError;
  int _imageGeneration = 0;

  Color _selectedColor = kColoringRed;
  int _taskIndex = 0;
  bool _completed = false;
  bool _muted = false;

  LessonColoringTask? get _task =>
      _completed || _taskIndex >= _data.tasks.length
          ? null
          : _data.tasks[_taskIndex];

  @override
  void initState() {
    super.initState();
    _data = lessonColoringDataFor(widget.lessonIndex);
    _loadImage();
    WidgetsBinding.instance.addPostFrameCallback((_) => _speakInstruction());
  }

  @override
  void dispose() {
    TtsService.instance.stop();
    _image?.dispose();
    super.dispose();
  }

  Future<void> _loadImage() async {
    try {
      final data = await rootBundle.load(_data.asset);
      final codec = await ui.instantiateImageCodec(
        data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
        targetWidth: 800,
      );
      final frame = await codec.getNextFrame();
      codec.dispose();
      final image = frame.image;
      final byteData = await image.toByteData(
        format: ui.ImageByteFormat.rawRgba,
      );
      if (byteData == null) {
        image.dispose();
        throw StateError('Could not read the coloring image.');
      }
      final pixels = byteData.buffer.asUint8List(
        byteData.offsetInBytes,
        byteData.lengthInBytes,
      );
      if (!mounted) {
        image.dispose();
        return;
      }
      setState(() {
        _image = image;
        _imageWidth = image.width;
        _imageHeight = image.height;
        _pixels = pixels;
        _originalPixels = Uint8List.fromList(pixels);
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = '$error';
      });
    }
  }

  Future<void> _speak(String text) async {
    if (_muted) return;
    await TtsService.instance.speak(text);
  }

  void _speakInstruction() {
    final task = _task;
    if (task == null) return;
    _speak(task.instruction);
  }

  void _selectColor(Color color, String name) {
    setState(() => _selectedColor = color);
    _speak(name);
  }

  bool _isFillable(int index) {
    final pixels = _pixels;
    if (pixels == null) return false;
    if (pixels[index + 3] < 128) return false;
    final r = pixels[index];
    final g = pixels[index + 1];
    final b = pixels[index + 2];
    final luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 200;
  }

  void _floodFill(int startX, int startY, Color color) {
    final pixels = _pixels;
    if (pixels == null) return;
    final width = _imageWidth;
    final height = _imageHeight;
    final start = startY * width + startX;
    final startIndex = start * 4;
    if (!_isFillable(startIndex)) return;

    final fillR = (color.r * 255.0).round();
    final fillG = (color.g * 255.0).round();
    final fillB = (color.b * 255.0).round();
    final visited = Uint8List(width * height);
    final stack = <int>[start];

    while (stack.isNotEmpty) {
      final pixel = stack.removeLast();
      if (visited[pixel] != 0) continue;
      visited[pixel] = 1;
      final index = pixel * 4;
      if (!_isFillable(index)) continue;

      pixels[index] = fillR;
      pixels[index + 1] = fillG;
      pixels[index + 2] = fillB;
      pixels[index + 3] = 255;

      final x = pixel % width;
      final y = pixel ~/ width;
      if (x > 0) stack.add(pixel - 1);
      if (x < width - 1) stack.add(pixel + 1);
      if (y > 0) stack.add(pixel - width);
      if (y < height - 1) stack.add(pixel + width);
    }
  }

  void _refreshImage() {
    final pixels = _pixels;
    if (pixels == null) return;
    final generation = ++_imageGeneration;
    ui.decodeImageFromPixels(
      Uint8List.fromList(pixels),
      _imageWidth,
      _imageHeight,
      ui.PixelFormat.rgba8888,
      (image) {
        if (!mounted || generation != _imageGeneration) {
          image.dispose();
          return;
        }
        final oldImage = _image;
        setState(() => _image = image);
        if (oldImage != null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => oldImage.dispose());
        }
      },
    );
  }

  void _onTap(Offset localPosition, Size size) {
    if (_pixels == null || size.width <= 0 || size.height <= 0) return;
    final x = (localPosition.dx / size.width * _imageWidth)
        .floor()
        .clamp(0, _imageWidth - 1)
        .toInt();
    final y = (localPosition.dy / size.height * _imageHeight)
        .floor()
        .clamp(0, _imageHeight - 1)
        .toInt();
    _onTapImage(x, y);
  }

  void _onTapImage(int x, int y) {
    final pixels = _pixels;
    if (pixels == null) return;
    final index = (y * _imageWidth + x) * 4;
    if (!_isFillable(index)) return;

    final task = _task;
    final targetRadius = 0.06 * _imageWidth;
    final isTarget = task != null &&
        (Offset(x.toDouble(), y.toDouble()) -
                    Offset(task.x * _imageWidth, task.y * _imageHeight))
                .distance <=
            targetRadius;

    _undoStack.add(
      _UndoEntry(Uint8List.fromList(pixels), _taskIndex, _completed),
    );
    _floodFill(x, y, _selectedColor);

    var advanced = false;
    var completedNow = false;
    if (task != null && isTarget && _selectedColor == task.color) {
      for (final point in task.extraPoints) {
        final ex = (point.dx * _imageWidth)
            .floor()
            .clamp(0, _imageWidth - 1)
            .toInt();
        final ey = (point.dy * _imageHeight)
            .floor()
            .clamp(0, _imageHeight - 1)
            .toInt();
        _floodFill(ex, ey, task.color);
      }
      final next = _taskIndex + 1;
      if (next >= _data.tasks.length) {
        _completed = true;
        completedNow = true;
      } else {
        _taskIndex = next;
        advanced = true;
      }
    } else if (task != null && isTarget) {
      SoundService.instance.playError();
    }

    _refreshImage();
    if (completedNow) {
      SoundService.instance.playComplete();
      _speak('Great job!');
    } else if (advanced) {
      SoundService.instance.playCorrect();
      _speakInstruction();
    }
  }

  void _undo() {
    if (_undoStack.isEmpty) return;
    final entry = _undoStack.removeLast();
    final pixels = _pixels;
    if (pixels == null) return;
    setState(() {
      pixels.setAll(0, entry.pixels);
      _taskIndex = entry.taskIndex;
      _completed = entry.completed;
    });
    _refreshImage();
  }

  void _clearAll() {
    final pixels = _pixels;
    final original = _originalPixels;
    if (pixels == null || original == null) return;
    setState(() {
      pixels.setAll(0, original);
      _undoStack.clear();
      _taskIndex = 0;
      _completed = false;
    });
    _refreshImage();
    _speakInstruction();
  }

  void _toggleMute() {
    setState(() => _muted = !_muted);
    SoundService.instance.muted = _muted;
    if (_muted) TtsService.instance.stop();
  }

  Widget _paletteDot(Color color, String name) {
    final selected = _selectedColor == color;
    return GestureDetector(
      key: ValueKey('color-$name'),
      onTap: () => _selectColor(color, name),
      child: Semantics(
        label: name,
        button: true,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(
              color: selected ? kInk : Colors.transparent,
              width: 3,
            ),
            boxShadow: selected
                ? const [
                    BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    ),
                  ]
                : null,
          ),
        ),
      ),
    );
  }

  Widget _instruction(LessonColoringTask task) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Text.rich(
        TextSpan(
          style: const TextStyle(
            fontSize: 18,
            height: 1.25,
            fontWeight: FontWeight.w800,
            color: kInk,
          ),
          children: [
            TextSpan(text: 'Color the ${task.label} '),
            TextSpan(
              text: task.colorName.toLowerCase(),
              style: TextStyle(color: task.color),
            ),
            const TextSpan(text: '.'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildCanvas(LessonColoringTask? task) {
    if (_loading) {
      return const AspectRatio(
        aspectRatio: 1,
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_loadError != null || _image == null) {
      return const AspectRatio(
        aspectRatio: 1,
        child: Center(
          child: Text(
            'تعذر تحميل صورة التلوين.',
            style: TextStyle(
              color: kMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      );
    }

    return AspectRatio(
      aspectRatio: _imageWidth / _imageHeight,
      child: Container(
        key: const ValueKey('coloring-canvas'),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: kLine, width: 2),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final size = Size(constraints.maxWidth, constraints.maxHeight);
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapDown: (details) => _onTap(details.localPosition, size),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  RawImage(
                    image: _image,
                    fit: BoxFit.fill,
                    filterQuality: FilterQuality.medium,
                  ),
                  if (task != null)
                    Positioned.fill(
                      child: IgnorePointer(
                        child: CustomPaint(
                          painter: _TargetRingPainter(
                            target: task.target,
                            color: task.color,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final task = _task;
    final total = _data.tasks.length;
    final counter = _completed ? total : _taskIndex + 1;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: SoftCard(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const CircleIcon(
                      icon: Icons.palette_rounded,
                      background: kSoftOrange,
                      foreground: Color(0xFFF6A55C),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'درس التلوين',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: kInk,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'اختر اللون ثم اضغط على الجزء المطلوب.',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w500,
                              color: kMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '$counter / $total',
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: kMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (task != null)
                  _instruction(task)
                else
                  const Text(
                    '✅ أحسنت! اكتمل التلوين.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: kPrimaryDark,
                    ),
                  ),
              ],
            ),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Center(child: _buildCanvas(task)),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: kLine)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: _palette.map((entry) {
              final (color, name) = entry;
              return _paletteDot(color, name);
            }).toList(),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
          child: Row(
            children: [
              IconButton(
                onPressed: _undo,
                tooltip: 'تراجع',
                icon: const Icon(Icons.undo_rounded, color: kInk),
              ),
              IconButton(
                onPressed: _clearAll,
                tooltip: 'مسح',
                icon: const Icon(Icons.delete_outline_rounded, color: kInk),
              ),
              IconButton(
                onPressed: _toggleMute,
                tooltip: 'الصوت',
                icon: Icon(
                  _muted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                  color: kInk,
                ),
              ),
              TextButton(
                onPressed: widget.onComplete,
                style: TextButton.styleFrom(
                  foregroundColor: kMuted,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  minimumSize: const Size(0, 40),
                ),
                child: const Text('تخطي'),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: FilledButton(
                  onPressed: _completed ? widget.onComplete : null,
                  child: const Text('متابعة'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TargetRingPainter extends CustomPainter {
  final Offset target;
  final Color color;

  const _TargetRingPainter({required this.target, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(target.dx * size.width, target.dy * size.height);
    canvas.drawCircle(
      center,
      17,
      Paint()
        ..color = const Color(0xD9FFFFFF)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6,
    );
    canvas.drawCircle(
      center,
      13,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5,
    );
    canvas.drawCircle(center, 3, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _TargetRingPainter oldDelegate) =>
      oldDelegate.target != target || oldDelegate.color != color;
}
