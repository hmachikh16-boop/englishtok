import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import 'theme.dart';

// ===================== DATA =====================

class ColoringRegion {
  final String id;
  final Path path;
  Color color;
  ColoringRegion({required this.id, required this.path, this.color = Colors.white});
}

class ColoringPageData {
  final String name;
  final String emoji;
  final List<ColoringRegion> regions;
  final List<Path> outline;
  ColoringPageData({
    required this.name,
    required this.emoji,
    required this.regions,
    required this.outline,
  });
}

// ===================== PAGE DEFINITIONS =====================

List<ColoringPageData> buildColoringPages() {
  const w = 300.0;
  const h = 300.0;

  // Helper to make a rect path
  Path r(double x, double y, double width, double height) =>
      Path()..addRect(Rect.fromLTWH(x, y, width, height));

  // Helper to make an oval path
  Path o(double cx, double cy, double rx, double ry) =>
      Path()..addOval(Rect.fromCenter(center: Offset(cx, cy), width: rx * 2, height: ry * 2));

  // Helper to make a rounded rect
  Path rr(double x, double y, double width, double height, double radius) =>
      Path()..addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(x, y, width, height), Radius.circular(radius)));

  final pages = <ColoringPageData>[];

  // 1. Apple
  {
    final body = o(150, 170, 70, 80);
    final leaf = o(155, 95, 20, 12);
    final outline = <Path>[
      // apple body outline
      Path()..addOval(Rect.fromCenter(center: Offset(150, 170), width: 140, height: 160)),
      // leaf outline
      Path()..addOval(Rect.fromCenter(center: Offset(155, 95), width: 40, height: 24)),
      // stem
      Path()..moveTo(150, 100)..lineTo(150, 85),
    ];
    pages.add(ColoringPageData(
      name: 'تفاحة',
      emoji: '🍎',
      regions: [ColoringRegion(id: 'body', path: body), ColoringRegion(id: 'leaf', path: leaf)],
      outline: outline,
    ));
  }

  // 2. Sun & Cloud
  {
    final sun = o(200, 100, 50, 50);
    final cloud = rr(60, 60, 120, 60, 30);
    final outline = <Path>[
      Path()..addOval(Rect.fromCenter(center: Offset(200, 100), width: 100, height: 100)),
      rr(60, 60, 120, 60, 30),
    ];
    pages.add(ColoringPageData(
      name: 'شمس وسحابة',
      emoji: '☀️',
      regions: [ColoringRegion(id: 'sun', path: sun), ColoringRegion(id: 'cloud', path: cloud)],
      outline: outline,
    ));
  }

  // 3. Cat
  {
    final body = o(150, 180, 70, 60);
    final eyes = Path()
      ..addOval(Rect.fromCenter(center: Offset(130, 160), width: 16, height: 16))
      ..addOval(Rect.fromCenter(center: Offset(170, 160), width: 16, height: 16));
    final ears = Path()
      ..moveTo(90, 140)..lineTo(110, 100)..lineTo(130, 140)..close()
      ..moveTo(170, 140)..lineTo(190, 100)..lineTo(210, 140)..close();
    final outline = <Path>[
      Path()..addOval(Rect.fromCenter(center: Offset(150, 180), width: 140, height: 120)),
      Path()..addOval(Rect.fromCenter(center: Offset(130, 160), width: 16, height: 16)),
      Path()..addOval(Rect.fromCenter(center: Offset(170, 160), width: 16, height: 16)),
      Path()..moveTo(90, 140)..lineTo(110, 100)..lineTo(130, 140)..close(),
      Path()..moveTo(170, 140)..lineTo(190, 100)..lineTo(210, 140)..close(),
    ];
    pages.add(ColoringPageData(
      name: 'قطة',
      emoji: '🐱',
      regions: [
        ColoringRegion(id: 'body', path: body),
        ColoringRegion(id: 'eyes', path: eyes),
        ColoringRegion(id: 'ears', path: ears),
      ],
      outline: outline,
    ));
  }

  // 4. Dog
  {
    final body = o(150, 180, 80, 60);
    final ears = Path()
      ..moveTo(80, 160)..lineTo(60, 120)..lineTo(100, 140)..close()
      ..moveTo(200, 160)..lineTo(220, 120)..lineTo(240, 140)..close();
    final tongue = o(150, 200, 12, 8);
    final outline = <Path>[
      Path()..addOval(Rect.fromCenter(center: Offset(150, 180), width: 160, height: 120)),
      Path()..moveTo(80, 160)..lineTo(60, 120)..lineTo(100, 140)..close(),
      Path()..moveTo(200, 160)..lineTo(220, 120)..lineTo(240, 140)..close(),
      Path()..addOval(Rect.fromCenter(center: Offset(150, 200), width: 24, height: 16)),
    ];
    pages.add(ColoringPageData(
      name: 'كلب',
      emoji: '🐶',
      regions: [
        ColoringRegion(id: 'body', path: body),
        ColoringRegion(id: 'ears', path: ears),
        ColoringRegion(id: 'tongue', path: tongue),
      ],
      outline: outline,
    ));
  }

  // 5. House
  {
    final wall = r(90, 150, 120, 100);
    final roof = Path()..moveTo(80, 150)..lineTo(150, 90)..lineTo(220, 150)..close();
    final door = r(130, 190, 40, 60);
    final window = r(100, 165, 30, 30);
    final outline = <Path>[
      r(90, 150, 120, 100),
      Path()..moveTo(80, 150)..lineTo(150, 90)..lineTo(220, 150)..close(),
      r(130, 190, 40, 60),
      r(100, 165, 30, 30),
    ];
    pages.add(ColoringPageData(
      name: 'بيت',
      emoji: '🏠',
      regions: [
        ColoringRegion(id: 'wall', path: wall),
        ColoringRegion(id: 'roof', path: roof),
        ColoringRegion(id: 'door', path: door),
        ColoringRegion(id: 'window', path: window),
      ],
      outline: outline,
    ));
  }

  // 6. Car
  {
    final body = rr(60, 150, 180, 60, 15);
    final wheels = Path()
      ..addOval(Rect.fromCenter(center: Offset(90, 220), width: 40, height: 40))
      ..addOval(Rect.fromCenter(center: Offset(210, 220), width: 40, height: 40));
    final windows = rr(80, 120, 140, 40, 10);
    final outline = <Path>[
      rr(60, 150, 180, 60, 15),
      Path()..addOval(Rect.fromCenter(center: Offset(90, 220), width: 40, height: 40)),
      Path()..addOval(Rect.fromCenter(center: Offset(210, 220), width: 40, height: 40)),
      rr(80, 120, 140, 40, 10),
    ];
    pages.add(ColoringPageData(
      name: 'سيارة',
      emoji: '🚗',
      regions: [
        ColoringRegion(id: 'body', path: body),
        ColoringRegion(id: 'wheels', path: wheels),
        ColoringRegion(id: 'windows', path: windows),
      ],
      outline: outline,
    ));
  }

  // 7. Flower
  {
    final petals = Path();
    for (int i = 0; i < 6; i++) {
      final angle = i * math.pi / 3;
      final cx = 150 + 30 * math.cos(angle);
      final cy = 120 + 30 * math.sin(angle);
      petals.addOval(Rect.fromCenter(center: Offset(cx, cy), width: 40, height: 40));
    }
    final stem = r(145, 150, 10, 100);
    final leaves = Path()
      ..addOval(Rect.fromCenter(center: Offset(120, 200), width: 30, height: 20))
      ..addOval(Rect.fromCenter(center: Offset(180, 200), width: 30, height: 20));
    final outline = <Path>[
      ...List.generate(6, (i) {
        final angle = i * math.pi / 3;
        final cx = 150 + 30 * math.cos(angle);
        final cy = 120 + 30 * math.sin(angle);
        return Path()..addOval(Rect.fromCenter(center: Offset(cx, cy), width: 40, height: 40));
      }),
      r(145, 150, 10, 100),
      Path()..addOval(Rect.fromCenter(center: Offset(120, 200), width: 30, height: 20)),
      Path()..addOval(Rect.fromCenter(center: Offset(180, 200), width: 30, height: 20)),
    ];
    pages.add(ColoringPageData(
      name: 'وردة',
      emoji: '🌸',
      regions: [
        ColoringRegion(id: 'petals', path: petals),
        ColoringRegion(id: 'stem', path: stem),
        ColoringRegion(id: 'leaves', path: leaves),
      ],
      outline: outline,
    ));
  }

  // 8. Fish
  {
    final body = o(150, 150, 80, 50);
    final tail = Path()..moveTo(230, 150)..lineTo(270, 120)..lineTo(270, 180)..close();
    final eye = o(100, 140, 8, 8);
    final outline = <Path>[
      Path()..addOval(Rect.fromCenter(center: Offset(150, 150), width: 160, height: 100)),
      Path()..moveTo(230, 150)..lineTo(270, 120)..lineTo(270, 180)..close(),
      Path()..addOval(Rect.fromCenter(center: Offset(100, 140), width: 16, height: 16)),
    ];
    pages.add(ColoringPageData(
      name: 'سمكة',
      emoji: '🐟',
      regions: [
        ColoringRegion(id: 'body', path: body),
        ColoringRegion(id: 'tail', path: tail),
        ColoringRegion(id: 'eye', path: eye),
      ],
      outline: outline,
    ));
  }

  // 9. Butterfly
  {
    final rightWing = o(200, 130, 60, 80);
    final leftWing = o(100, 130, 60, 80);
    final body = r(145, 100, 10, 120);
    final outline = <Path>[
      Path()..addOval(Rect.fromCenter(center: Offset(200, 130), width: 120, height: 160)),
      Path()..addOval(Rect.fromCenter(center: Offset(100, 130), width: 120, height: 160)),
      r(145, 100, 10, 120),
    ];
    pages.add(ColoringPageData(
      name: 'فراشة',
      emoji: '🦋',
      regions: [
        ColoringRegion(id: 'rightWing', path: rightWing),
        ColoringRegion(id: 'leftWing', path: leftWing),
        ColoringRegion(id: 'body', path: body),
      ],
      outline: outline,
    ));
  }

  // 10. Banana & Orange
  {
    final banana = Path()
      ..moveTo(80, 120)..quadraticBezierTo(120, 80, 160, 120)..quadraticBezierTo(140, 180, 100, 200)..quadraticBezierTo(60, 160, 80, 120)..close();
    final orange = o(220, 160, 40, 40);
    final leaf = o(200, 110, 15, 10);
    final outline = <Path>[
      Path()..moveTo(80, 120)..quadraticBezierTo(120, 80, 160, 120)..quadraticBezierTo(140, 180, 100, 200)..quadraticBezierTo(60, 160, 80, 120)..close(),
      Path()..addOval(Rect.fromCenter(center: Offset(220, 160), width: 80, height: 80)),
      Path()..addOval(Rect.fromCenter(center: Offset(200, 110), width: 30, height: 20)),
    ];
    pages.add(ColoringPageData(
      name: 'موزة وبرتقالة',
      emoji: '🍌',
      regions: [
        ColoringRegion(id: 'banana', path: banana),
        ColoringRegion(id: 'orange', path: orange),
        ColoringRegion(id: 'leaf', path: leaf),
      ],
      outline: outline,
    ));
  }

  return pages;
}

// ===================== PAINTER =====================

class ColoringPagePainter extends CustomPainter {
  final ColoringPageData page;
  final double scale;
  ColoringPagePainter({required this.page, this.scale = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(scale, scale);
    // Fill regions
    for (final region in page.regions) {
      final paint = Paint()
        ..color = region.color
        ..style = PaintingStyle.fill;
      canvas.drawPath(region.path, paint);
    }
    // Draw outlines
    final outlinePaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    for (final path in page.outline) {
      canvas.drawPath(path, outlinePaint);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant ColoringPagePainter oldDelegate) => true;
}

// ===================== COLORING GAME SCREEN =====================

class ColoringGameScreen extends StatefulWidget {
  final ColoringPageData page;
  const ColoringGameScreen({super.key, required this.page});

  @override
  State<ColoringGameScreen> createState() => _ColoringGameScreenState();
}

class _ColoringGameScreenState extends State<ColoringGameScreen> {
  static const _colors = [
    (Colors.red, 'Red', 'أحمر'),
    (Colors.blue, 'Blue', 'أزرق'),
    (Colors.green, 'Green', 'أخضر'),
    (Colors.yellow, 'Yellow', 'أصفر'),
    (Colors.orange, 'Orange', 'برتقالي'),
    (Colors.pink, 'Pink', 'وردي'),
  ];

  Color _selectedColor = Colors.red;
  String _selectedColorName = 'Red';
  String _selectedColorAr = 'أحمر';
  bool _muted = false;
  final FlutterTts _tts = FlutterTts();
  late List<ColoringRegion> _regions;
  final List<Map<String, Color>> _undoStack = [];

  @override
  void initState() {
    super.initState();
    _regions = widget.page.regions.map((r) => ColoringRegion(id: r.id, path: r.path, color: r.color)).toList();
    _initTts();
  }

  Future<void> _initTts() async {
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.5);
  }

  Future<void> _speakColor() async {
    if (_muted) return;
    await _tts.speak('$_selectedColorName - $_selectedColorAr');
  }

  void _selectColor(Color color, String name, String ar) {
    setState(() {
      _selectedColor = color;
      _selectedColorName = name;
      _selectedColorAr = ar;
    });
    _speakColor();
  }

  void _onTap(Offset localPosition, Size size) {
    // Scale tap position to canvas coordinates (300x300)
    final scaleX = 300.0 / size.width;
    final scaleY = 300.0 / size.height;
    final canvasPoint = Offset(localPosition.dx * scaleX, localPosition.dy * scaleY);

    for (final region in _regions) {
      if (region.path.contains(canvasPoint)) {
        // Save undo state
        _undoStack.add({region.id: region.color});
        setState(() {
          region.color = _selectedColor;
        });
        break;
      }
    }
  }

  void _clearAll() {
    setState(() {
      for (final region in _regions) {
        _undoStack.add({region.id: region.color});
        region.color = Colors.white;
      }
    });
  }

  void _undo() {
    if (_undoStack.isEmpty) return;
    final last = _undoStack.removeLast();
    setState(() {
      for (final entry in last.entries) {
        final region = _regions.firstWhere((r) => r.id == entry.key);
        region.color = entry.value;
      }
    });
  }

  @override
  void dispose() {
    _tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          widget.page.name,
          style: const TextStyle(color: Color(0xFF000000), fontWeight: FontWeight.w800),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF000000)),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_muted ? Icons.volume_off_rounded : Icons.volume_up_rounded, color: const Color(0xFF000000)),
            onPressed: () => setState(() => _muted = !_muted),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFF000000)),
            onPressed: _clearAll,
          ),
          IconButton(
            icon: const Icon(Icons.undo_rounded, color: Color(0xFF000000)),
            onPressed: _undo,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: AspectRatio(
                aspectRatio: 1.0,
                child: GestureDetector(
                  onTapDown: (details) {
                    final box = context.findRenderObject() as RenderBox?;
                    if (box == null) return;
                    // We need the size of the AspectRatio child, not the whole screen
                  },
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final size = Size(constraints.maxWidth, constraints.maxHeight);
                      return GestureDetector(
                        onTapDown: (details) {
                          _onTap(details.localPosition, size);
                        },
                        child: CustomPaint(
                          size: size,
                          painter: ColoringPagePainter(
                            page: widget.page,
                            scale: size.width / 300.0,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          // Palette
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: _colors.map((c) {
                final (color, name, ar) = c;
                final isSelected = _selectedColor == color;
                return GestureDetector(
                  onTap: () => _selectColor(color, name, ar),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? const Color(0xFF000000) : Colors.transparent,
                        width: 3,
                      ),
                      boxShadow: isSelected
                          ? [const BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2))]
                          : null,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: const Color(0xFF000000)),
                onPressed: () => Navigator.pop(context),
                child: const Text('✅ أحسنت! اختر صورة أخرى', style: TextStyle(color: Colors.white)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ===================== LIST SCREEN =====================

class ColoringPageListScreen extends StatelessWidget {
  const ColoringPageListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pages = buildColoringPages();
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'لعبة التلوين',
          style: TextStyle(color: Color(0xFF000000), fontWeight: FontWeight.w800),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF000000)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.0,
        ),
        itemCount: pages.length,
        itemBuilder: (context, index) {
          final page = pages[index];
          return GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ColoringGameScreen(page: page)),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE5E7EB)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(page.emoji, style: const TextStyle(fontSize: 48)),
                  const SizedBox(height: 8),
                  Text(
                    page.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF000000),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
