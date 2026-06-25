import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';

/// 单张照片的上传状态
enum UploadItemStatus { waiting, uploading, done, failed }

/// 单张照片的进度状态数据
class UploadItemState {
  final AssetEntity asset;
  UploadItemStatus status;
  double progress;

  UploadItemState({
    required this.asset,
    this.status = UploadItemStatus.waiting,
    this.progress = 0.0,
  });
}

/// 上传进度 BottomSheet
///
/// 展示每张照片的上传状态（等待中 / 上传中 / 成功 / 失败）和进度条。
/// 全部完成后延迟 1 秒自动收起（通过 [onAllDone] 回调通知外部）。
class UploadProgressSheet extends StatefulWidget {
  final List<AssetEntity> assets;

  /// 全部完成后的回调
  final VoidCallback? onAllDone;

  const UploadProgressSheet({
    super.key,
    required this.assets,
    this.onAllDone,
  });

  @override
  State<UploadProgressSheet> createState() => UploadProgressSheetState();
}

class UploadProgressSheetState extends State<UploadProgressSheet> {
  late final List<UploadItemState> _items;

  /// 缩略图 Future 缓存：key 为 asset.id
  /// 避免进度更新时重建导致图片闪烁
  final Map<String, Future<Uint8List?>> _thumbnailCache = {};

  @override
  void initState() {
    super.initState();
    _items = widget.assets
        .map((a) => UploadItemState(asset: a))
        .toList();
  }

  // ---------------------------------------------------------------------------
  // Task 3.3 — 暴露进度更新方法
  // ---------------------------------------------------------------------------

  /// 更新某张照片的上传进度（0.0–1.0）
  void updateProgress(String assetId, double progress) {
    final item = _findItem(assetId);
    if (item == null) return;
    setState(() {
      item.status = UploadItemStatus.uploading;
      item.progress = progress.clamp(0.0, 1.0);
    });
  }

  /// 标记某张照片上传成功
  void markDone(String assetId) {
    final item = _findItem(assetId);
    if (item == null) return;
    setState(() {
      item.status = UploadItemStatus.done;
      item.progress = 1.0;
    });
    _checkAllDone();
  }

  /// 标记某张照片上传失败
  void markFailed(String assetId) {
    final item = _findItem(assetId);
    if (item == null) return;
    setState(() {
      item.status = UploadItemStatus.failed;
    });
    _checkAllDone();
  }

  UploadItemState? _findItem(String assetId) {
    try {
      return _items.firstWhere((i) => i.asset.id == assetId);
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Task 3.4 — 全部完成后延迟 1 秒自动收起
  // ---------------------------------------------------------------------------

  void _checkAllDone() {
    final allDone = _items.every(
      (i) =>
          i.status == UploadItemStatus.done ||
          i.status == UploadItemStatus.failed,
    );
    if (!allDone) return;

    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      widget.onAllDone?.call();
    });
  }

  // ---------------------------------------------------------------------------
  // Task 3.2 — 上传列表展示
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHeader(),
          const Divider(height: 1),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.5,
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _items.length,
              itemBuilder: (_, index) => _buildItem(_items[index]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final doneCount =
        _items.where((i) => i.status == UploadItemStatus.done).length;
    final failedCount =
        _items.where((i) => i.status == UploadItemStatus.failed).length;
    final total = _items.length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          const Icon(Icons.cloud_upload_outlined),
          const SizedBox(width: 8),
          Text(
            '上传进度（$doneCount/$total）${failedCount > 0 ? '，$failedCount 失败' : ''}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(UploadItemState item) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildThumbnail(item.asset),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.asset.title ?? item.asset.id,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                _buildProgressBar(item),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _buildStatusIcon(item.status),
        ],
      ),
    );
  }

  Widget _buildThumbnail(AssetEntity asset) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: SizedBox(
        width: 44,
        height: 44,
        child: FutureBuilder<Uint8List?>(
          future: _thumbnailCache.putIfAbsent(
            asset.id,
            () => asset.thumbnailData,
          ),
          builder: (_, snap) {
            if (snap.connectionState != ConnectionState.done ||
                snap.data == null) {
              return const ColoredBox(color: Color(0xFFE0E0E0));
            }
            return Image.memory(snap.data!, fit: BoxFit.cover);
          },
        ),
      ),
    );
  }

  Widget _buildProgressBar(UploadItemState item) {
    if (item.status == UploadItemStatus.waiting) {
      return const Text(
        '等待中',
        style: TextStyle(fontSize: 12, color: Colors.grey),
      );
    }
    if (item.status == UploadItemStatus.failed) {
      return const Text(
        '上传失败',
        style: TextStyle(fontSize: 12, color: Colors.red),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LinearProgressIndicator(
          value: item.progress,
          minHeight: 4,
          backgroundColor: Colors.grey.shade200,
        ),
        const SizedBox(height: 2),
        Text(
          item.status == UploadItemStatus.done
              ? '已完成'
              : '${(item.progress * 100).toStringAsFixed(0)}%',
          style: const TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildStatusIcon(UploadItemStatus status) {
    switch (status) {
      case UploadItemStatus.waiting:
        return const Icon(Icons.schedule, size: 18, color: Colors.grey);
      case UploadItemStatus.uploading:
        return const SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2),
        );
      case UploadItemStatus.done:
        return const Icon(Icons.check_circle, size: 18, color: Colors.green);
      case UploadItemStatus.failed:
        return const Icon(Icons.error_outline, size: 18, color: Colors.red);
    }
  }
}
