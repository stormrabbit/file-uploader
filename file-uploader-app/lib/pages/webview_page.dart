import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../config/upload_config.dart';
import '../services/upload_service.dart';
import '../widgets/upload_progress_sheet.dart';
import 'photo_picker_page.dart';

class WebViewPage extends StatefulWidget {
  final String url;
  const WebViewPage({super.key, required this.url});

  @override
  State<WebViewPage> createState() => _WebViewPageState();
}

class _WebViewPageState extends State<WebViewPage> {
  late final WebViewController _webViewController;

  /// 上传服务实例，baseUrl 从扫码 URL 提取 host + kUploadPort 构造
  late final UploadService _uploadService;

  @override
  void initState() {
    super.initState();

    // Task 4.1 — 从扫码 URL 提取 host，拼接上传端口构造 baseUrl
    final scannedUri = Uri.parse(widget.url);
    final uploadBaseUrl =
        '${scannedUri.scheme}://${scannedUri.host}:$kUploadPort';
    _uploadService = UploadService(baseUrl: uploadBaseUrl);

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'UploadBridge',
        onMessageReceived: _onBridgeMessage,
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  /// 处理来自 Web 端的 Bridge 消息
  void _onBridgeMessage(JavaScriptMessage message) {
    try {
      final data = jsonDecode(message.message) as Map<String, dynamic>;
      final action = data['action'] as String?;

      if (action == 'pickImage') {
        _openPhotoPicker();
      }
    } catch (e) {
      debugPrint('UploadBridge message parse error: $e');
    }
  }

  /// 打开相册选择器，用户确认后执行原生上传，完成后通过 Bridge 回传结果
  Future<void> _openPhotoPicker() async {
    // Task 4.2 — 跳转相册选择器
    final assets = await Navigator.of(context).push<List<AssetEntity>>(
      MaterialPageRoute(builder: (_) => const PhotoPickerPage()),
    );
    if (assets == null || assets.isEmpty) return;

    // Task 4.3/4.4 — 展示上传进度 BottomSheet 并绑定进度回调
    final sheetKey = GlobalKey<UploadProgressSheetState>();

    if (!mounted) return;
    showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      builder: (_) => UploadProgressSheet(
        key: sheetKey,
        assets: assets,
        onAllDone: () {
          if (mounted) Navigator.of(context).pop();
        },
      ),
    );

    // Task 4.4 — 执行串行上传，将进度实时传递给 BottomSheet
    final results = await _uploadService.uploadAssets(
      assets,
      onProgress: (assetId, progress) {
        sheetKey.currentState?.updateProgress(assetId, progress);
      },
      onItemDone: (assetId, result) {
        if (result != null) {
          sheetKey.currentState?.markDone(assetId);
        } else {
          sheetKey.currentState?.markFailed(assetId);
        }
      },
    );

    // Task 4.5 — 全部完成后检查 mounted，通过 Bridge 回传结果
    if (!mounted) return;
    final jsonString =
        jsonEncode(results.map((r) => r.toJson()).toList())
            .replaceAll("'", "\\'");
    await _webViewController
        .runJavaScript("window.UploadBridge_callback('$jsonString')");
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('文件上传'),
        backgroundColor: colorScheme.inversePrimary,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: WebViewWidget(controller: _webViewController),
    );
  }
}
