import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'webview_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with WidgetsBindingObserver {
  final MobileScannerController _controller = MobileScannerController();
  bool _hasScanned = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _controller.start();
    } else if (state == AppLifecycleState.paused) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;

    final String? rawValue = capture.barcodes.firstOrNull?.rawValue;
    if (rawValue == null) return;

    final uri = Uri.tryParse(rawValue);
    if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https')) {
      setState(() => _hasScanned = true);
      _controller.stop();
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => WebViewPage(url: rawValue),
        ),
      ).then((_) {
        setState(() => _hasScanned = false);
        _controller.start();
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('非有效地址'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('扫码连接'),
        backgroundColor: colorScheme.inversePrimary,
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) {
              return _PermissionDeniedView(
                onRetry: () => _controller.start(),
              );
            },
          ),
          _ScannerOverlay(),
          const Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Text(
              '对准 PC 端二维码扫描',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w500,
                shadows: [
                  Shadow(
                    blurRadius: 4,
                    color: Colors.black54,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PermissionDeniedView extends StatelessWidget {
  final VoidCallback onRetry;
  const _PermissionDeniedView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              '需要摄像头权限才能扫描二维码',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.camera_alt),
              label: const Text('授权摄像头'),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScannerOverlay extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = constraints.biggest;
        final scanSize = size.width * 0.68;
        final left = (size.width - scanSize) / 2;
        final top = (size.height - scanSize) / 2 - 40;
        const cornerLen = 28.0;
        const cornerWidth = 3.5;
        const color = Colors.white;
        const radius = 6.0;

        return Stack(
          children: [
            // 半透明遮罩（四周暗区）
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Colors.black.withOpacity(0.5),
                BlendMode.srcOut,
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.black,
                      backgroundBlendMode: BlendMode.dstOut,
                    ),
                  ),
                  Positioned(
                    left: left,
                    top: top,
                    child: Container(
                      width: scanSize,
                      height: scanSize,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(radius),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // 四角边框
            Positioned(
              left: left,
              top: top,
              child: SizedBox(
                width: scanSize,
                height: scanSize,
                child: const CustomPaint(
                  painter: _CornerPainter(
                    color: color,
                    cornerLen: cornerLen,
                    strokeWidth: cornerWidth,
                    radius: radius,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _CornerPainter extends CustomPainter {
  final Color color;
  final double cornerLen;
  final double strokeWidth;
  final double radius;

  const _CornerPainter({
    required this.color,
    required this.cornerLen,
    required this.strokeWidth,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;
    final cl = cornerLen;

    // 左上
    canvas.drawPath(
      Path()
        ..moveTo(0, cl)
        ..lineTo(0, radius)
        ..arcToPoint(Offset(radius, 0), radius: Radius.circular(radius))
        ..lineTo(cl, 0),
      paint,
    );
    // 右上
    canvas.drawPath(
      Path()
        ..moveTo(w - cl, 0)
        ..lineTo(w - radius, 0)
        ..arcToPoint(Offset(w, radius), radius: Radius.circular(radius))
        ..lineTo(w, cl),
      paint,
    );
    // 左下
    canvas.drawPath(
      Path()
        ..moveTo(0, h - cl)
        ..lineTo(0, h - radius)
        ..arcToPoint(Offset(radius, h), radius: Radius.circular(radius))
        ..lineTo(cl, h),
      paint,
    );
    // 右下
    canvas.drawPath(
      Path()
        ..moveTo(w - cl, h)
        ..lineTo(w - radius, h)
        ..arcToPoint(Offset(w, h - radius), radius: Radius.circular(radius))
        ..lineTo(w, h - cl),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
