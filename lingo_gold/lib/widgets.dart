import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'data.dart';
import 'theme.dart';

class LessonImage extends StatelessWidget {
  final Lesson lesson;
  final BoxFit fit;
  final double? width;
  final double? height;
  const LessonImage({
    super.key,
    required this.lesson,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
  });

  String get assetPath => lesson.isPack
      ? 'assets/images/${lesson.imageFile}_${lesson.indexInPack}.jpg'
      : 'assets/images/${lesson.imageFile}.jpg';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      assetPath,
      width: width ?? double.infinity,
      height: height ?? double.infinity,
      fit: fit,
      errorBuilder: (_, __, ___) => Container(
        color: kCard,
        alignment: Alignment.center,
        child: const Icon(Icons.image_outlined, color: kMuted, size: 32),
      ),
    );
  }
}

class LessonThumb extends StatelessWidget {
  final Lesson lesson;
  final double size;
  final double radius;
  const LessonThumb({
    super.key,
    required this.lesson,
    this.size = 64,
    this.radius = 14,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: SizedBox(
        width: size,
        height: size,
        child: LessonImage(lesson: lesson),
      ),
    );
  }
}

class BrandMark extends StatelessWidget {
  final bool compact;
  const BrandMark({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 32 : 38,
          height: compact ? 32 : 38,
          decoration: BoxDecoration(
            color: kPrimary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            Icons.auto_stories_rounded,
            color: Colors.white,
            size: compact ? 18 : 21,
          ),
        ),
        const SizedBox(width: 9),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Lingo Gold',
              style: TextStyle(
                color: kInk,
                fontSize: compact ? 16 : 19,
                fontWeight: FontWeight.w800,
                height: 1.05,
              ),
            ),
            if (!compact)
              const Text(
                'تعلم',
                style: TextStyle(
                  color: kMuted,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  height: 1.3,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class AppAvatar extends StatelessWidget {
  final double size;
  final VoidCallback? onTap;
  const AppAvatar({super.key, this.size = 42, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          color: kPrimary,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text(
          'S',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.4,
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;
  const SectionTitle({
    super.key,
    required this.title,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: kInk,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: kPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 6),
              minimumSize: const Size(0, 32),
            ),
            child: Text(
              action!,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
      ],
    );
  }
}

class SoftCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color color;
  final Border? border;
  const SoftCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.color = Colors.white,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(kRadius),
        border: border ?? Border.all(color: kLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class RoundedProgress extends StatelessWidget {
  final double value;
  final Color color;
  final Color background;
  final double height;
  const RoundedProgress({
    super.key,
    required this.value,
    this.color = kPrimary,
    this.background = kSoftGreen,
    this.height = 8,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: Directionality(
        textDirection: TextDirection.ltr,
        child: LinearProgressIndicator(
          value: value.clamp(0.0, 1.0),
          minHeight: height,
          backgroundColor: background,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      ),
    );
  }
}

class Pill extends StatelessWidget {
  final String text;
  final Color background;
  final Color foreground;
  final IconData? icon;
  final EdgeInsetsGeometry padding;
  const Pill({
    super.key,
    required this.text,
    this.background = kSoftGreen,
    this.foreground = kPrimaryDark,
    this.icon,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: foreground),
              const SizedBox(width: 5),
            ],
            Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: foreground,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CircleIcon extends StatelessWidget {
  final IconData icon;
  final Color background;
  final Color foreground;
  final double size;
  const CircleIcon({
    super.key,
    required this.icon,
    this.background = kSoftGreen,
    this.foreground = kPrimary,
    this.size = 44,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: Icon(icon, color: foreground, size: size * 0.48),
    );
  }
}

class StarRow extends StatelessWidget {
  final int filled;
  final double size;
  const StarRow({super.key, this.filled = 3, this.size = 16});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        3,
        (i) => Padding(
          padding: const EdgeInsets.only(right: 2),
          child: Icon(
            Icons.star_rounded,
            size: size,
            color: i < filled ? kGold : const Color(0xFFD9DCE1),
          ),
        ),
      ),
    );
  }
}

class StatTile extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const StatTile({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.color = kPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: kCard,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 7),
          Text(
            value,
            style: const TextStyle(
              color: kInk,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: kMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class BottomNavBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const BottomNavBar({super.key, required this.index, required this.onTap});

  static const _items = [
    (Icons.home_rounded, 'الرئيسية'),
    (Icons.person_rounded, 'ملفي'),
  ];

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 24 + bottomInset),
      child: Container(
        height: 76,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(38),
          boxShadow: const [
            BoxShadow(
              color: Color(0x26000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: List.generate(_items.length, (i) {
            final active = (i == 0 && index == 0) || (i == 1 && index == 3);
            return Expanded(
              child: GestureDetector(
                onTap: () => onTap(i == 0 ? 0 : 3),
                child: Container(
                  height: 60,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFF1DB954) : const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _items[i].$1,
                        color: active ? Colors.white : const Color(0xFF6B7280),
                        size: 28,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _items[i].$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: active ? Colors.white : const Color(0xFF6B7280),
                          fontSize: 16,
                          fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class Waveform extends StatefulWidget {
  final bool active;
  final Color color;
  final double height;
  const Waveform({
    super.key,
    this.active = false,
    this.color = kSecondary,
    this.height = 58,
  });

  @override
  State<Waveform> createState() => _WaveformState();
}

class _WaveformState extends State<Waveform>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, __) => CustomPaint(
          painter: _WavePainter(
            phase: _controller.value,
            active: widget.active,
            color: widget.color,
          ),
        ),
      ),
    );
  }
}

class _WavePainter extends CustomPainter {
  final double phase;
  final bool active;
  final Color color;
  _WavePainter({required this.phase, required this.active, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 3;
    final count = math.max(24, (size.width / 7).floor());
    final step = size.width / count;
    final mid = size.height / 2;
    for (var i = 0; i < count; i++) {
      final base = math.sin(i * 0.62 + phase * math.pi * 2).abs();
      final envelope = math.sin((i / (count - 1)) * math.pi).abs();
      final amplitude = (active ? 1.0 : 0.42) * envelope;
      final h = 4 + base * (size.height * 0.42) * amplitude;
      final x = step * i + step / 2;
      canvas.drawLine(Offset(x, mid - h), Offset(x, mid + h), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _WavePainter old) =>
      old.phase != phase || old.active != active || old.color != color;
}
