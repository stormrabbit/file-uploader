import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';

import '../services/upload_queue.dart';

/// 上传进度 BottomSheet
///
/// 展示队列中每个任务的上传状态（等待中 / 上传中 / 成功 / 失败）和进度条，
/// 数据源为 [UploadQueue]，通过监听其变化驱动 UI 刷新。
/// 全部完成后延迟 1 秒自动收起（通过 [onAllDone] 回调通知外部）。
/// 存在失败任务且队列空闲时，提供「重试失败项」按钮。
class UploadProgressSheet extends StatefulWidget {
  final UploadQueue queue;

  /// 全部完成后的回调
  final VoidCallback? onAllDone;

  const UploadProgressSheet({
    super.key,
    required this.queue,
    this.onAllDone,
  });

  @override
  State<UploadProgressSheet> createState() => UploadProgressSheetState();
}

class UploadProgressSheetState extends State<UploadProgressSheet> {
  /// 缩略图 Future 缓存：key 为 asset.id
  /// 避免进度更新时重建导致图片闪烁
  final Map<String, Future<Uint8List?>> _thumbnailCache = {};

  bool _autoCloseScheduled = false;

  @override
  void initState() {
    super.initState();
    widget.queue.addListener(_onQueueChanged);
  }

  @override
  void dispose() {
    widget.queue.removeListener(_onQueueChanged);
    super.dispose();
  }

  void _onQueueChanged() {
    _checkAllDone();
  }

  // ---------------------------------------------------------------------------
  // Task 3.4 — 全部完成后延迟 1 秒自动收起
  // ---------------------------------------------------------------------------

  void _checkAllDone() {
    final tasks = widget.queue.tasks;
    if (tasks.isEmpty) return;
    final allDone = tasks.every(
      (t) =>
          t.status == UploadTaskStatus.done ||
          t.status == UploadTaskStatus.failed,
    );
    if (!allDone) {
      _autoCloseScheduled = false;
      return;
    }
    if (_autoCloseScheduled) return;
    _autoCloseScheduled = true;

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
    return AnimatedBuilder(
      animation: widget.queue,
      builder: (_, __) {
        final tasks = widget.queue.tasks;
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(tasks),
              const Divider(height: 1),
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.5,
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: tasks.length,
                  itemBuilder: (_, index) => _buildItem(tasks[index]),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(List<UploadTask> tasks) {
    final doneCount =
        tasks.where((t) => t.status == UploadTaskStatus.done).length;
    final failedCount =
        tasks.where((t) => t.status == UploadTaskStatus.failed).length;
    final hasUploading =
        tasks.any((t) => t.status == UploadTaskStatus.uploading);
    final total = tasks.length;
    final canRetry = failedCount > 0 && !hasUploading;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        children: [
          const Icon(Icons.cloud_upload_outlined),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '上传进度（$doneCount/$total）${failedCount > 0 ? '，$failedCount 失败' : ''}',
              style:
                  const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
          TextButton(
            onPressed: canRetry ? () => widget.queue.retryFailed() : null,
            child: const Text('重试失败项'),
          ),
        ],
      ),
    );
  }

  Widget _buildItem(UploadTask task) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildThumbnail(task.asset),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  task.asset.title ?? task.asset.id,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 4),
                _buildProgressBar(task),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _buildStatusIcon(task.status),
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

  Widget _buildProgressBar(UploadTask task) {
    if (task.status == UploadTaskStatus.waiting) {
      return const Text(
        '等待中',
        style: TextStyle(fontSize: 12, color: Colors.grey),
      );
    }
    if (task.status == UploadTaskStatus.failed) {
      return const Text(
        '上传失败',
        style: TextStyle(fontSize: 12, color: Colors.red),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LinearProgressIndicator(
          value: task.progress,
          minHeight: 4,
          backgroundColor: Colors.grey.shade200,
        ),
        const SizedBox(height: 2),
        Text(
          task.status == UploadTaskStatus.done
              ? '已完成'
              : '${(task.progress * 100).toStringAsFixed(0)}%',
          style: const TextStyle(fontSize: 11, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildStatusIcon(UploadTaskStatus status) {
    switch (status) {
      case UploadTaskStatus.waiting:
        return const Icon(Icons.schedule, size: 18, color: Colors.grey);
      case UploadTaskStatus.uploading:
        return const SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(strokeWidth: 2),
        );
      case UploadTaskStatus.done:
        return const Icon(Icons.check_circle, size: 18, color: Colors.green);
      case UploadTaskStatus.failed:
        return const Icon(Icons.error_outline, size: 18, color: Colors.red);
    }
  }
}
