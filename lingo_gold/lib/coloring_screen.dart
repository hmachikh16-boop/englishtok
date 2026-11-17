import 'package:flutter/material.dart';

import 'theme.dart';
import 'widgets.dart';

class ColoringCanvas extends StatefulWidget {
  final String imageAsset;
  final String prompt;
  final String? promptAr;
  final String? pageLabel;
  final VoidCallback onDone;
  const ColoringCanvas({
    super.key,
    required this.imageAsset,
    required this.prompt,
    this.promptAr,
    this.pageLabel,
    required this.onDone,
  });

  @override
  State<ColoringCanvas> createState() => _ColoringCanvasState();
}

class _Stroke {
  final List<Offset> points;
  final Color color;
  final double width;
  _Stroke(this.points, this.color, this.width);
}

class _ColoringCanvasState extends State<ColoringCanvas> {
  final List<_Stroke> _strokes = [];
  Color _color = const Color(0xFFE53935);
  double _width = 18;
  bool _showPalette = true;

  static const List<Color> _palette = [
    Color(0xFFE53935),
    Color(0xFFFB8C00),
    Color(0xFFFDD835),
    Color(0xFF43A047),
    Color(0xFF1E88E5),
    Color(0xFF8E24AA),
    Color(0xFF8D6E63),
    Color(0xFF212121),
  ];

  void _start(Offset p) {
    setState(() {
      _strokes.add(_Stroke([p], _color, _width));
    });
  }

  void _extend(Offset p) {
    if (_strokes.isEmpty) return;
    setState(() {
      _strokes.last.points.add(p);
    });
  }

  void _clear() {
    setState(() => _strokes.clear());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Prompt
        Container(
          width: double.infinity,
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: kSoftGreen,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: kPrimary.withValues(alpha: 0.25)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(Icons.brush_rounded, color: kPrimary),
                  const SizedBox(width: 8),
                  if (widget.pageLabel != null)
                    Pill(
                      text: widget.pageLabel!,
                      background: Colors.white,
                      foreground: kPrimaryDark,
                    ),
                  const Spacer(),
                ],
              ),
              const SizedBox(height: 8),
              Directionality(
                textDirection: TextDirection.ltr,
                child: Text(
                  widget.prompt,
                  textAlign: TextAlign.left,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: kInk,
                  ),
                ),
              ),
              if (widget.promptAr != null) ...[
                const SizedBox(height: 4),
                Text(
                  widget.promptAr!,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: kMuted,
                  ),
                ),
              ],
            ],
          ),
        ),
        // Canvas
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: kLine, width: 2),
            ),
            clipBehavior: Clip.antiAlias,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GestureDetector(
                  onPanStart: (d) => _start(d.localPosition),
                  onPanUpdate: (d) => _extend(d.localPosition),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(
                        widget.imageAsset,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.image_outlined,
                              size: 64, color: Color(0xFFCBD5E1)),
                        ),
                      ),
                      CustomPaint(
                        painter: _PaintPainter(_strokes),
                        size: Size(constraints.maxWidth, constraints.maxHeight),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        // Palette + actions
        Container(
          margin: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: kCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: kLine),
          ),
          child: Column(
            children: [
              if (_showPalette)
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.center,
                  children: [
                    for (final c in _palette)
                      GestureDetector(
                        onTap: () => setState(() => _color = c),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: c,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _color == c
                                  ? kPrimary
                                  : Colors.white,
                              width: _color == c ? 4 : 2,
                            ),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x22000000),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _clear,
                      icon: const Icon(Icons.delete_outline_rounded),
                      label: const Text('مسح'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: kPrimary,
                        side: const BorderSide(color: kLine),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: widget.onDone,
                      icon: const Icon(Icons.check_rounded),
                      label: const Text('تم'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimary,
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PaintPainter extends CustomPainter {
  final List<_Stroke> strokes;
  _PaintPainter(this.strokes);

  @override
  void paint(Canvas canvas, Size size) {
    for (final s in strokes) {
      if (s.points.isEmpty) continue;
      final paint = Paint()
        ..color = s.color.withValues(alpha: 0.75)
        ..strokeWidth = s.width
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;
      final path = Path()..moveTo(s.points.first.dx, s.points.first.dy);
      for (var i = 1; i < s.points.length; i++) {
        path.lineTo(s.points[i].dx, s.points[i].dy);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _PaintPainter oldDelegate) => true;
}
