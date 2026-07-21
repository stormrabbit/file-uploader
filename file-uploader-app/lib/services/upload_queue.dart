import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';

import 'upload_service.dart';

/// 单个上传任务的状态
enum UploadTaskStatus { waiting, uploading, done, failed, cancelled }

/// 队列中的单个上传任务
class UploadTask {
  final AssetEntity asset;
  UploadTaskStatus status;
  double progress;
  UploadResult? result;
  Object? error;

  UploadTask({
    required this.asset,
    this.status = UploadTaskStatus.waiting,
    this.progress = 0.0,
    this.result,
    this.error,
  });
}

/// 持有状态的上传任务队列。
///
/// 负责维护一批 [AssetEntity] 对应的上传任务状态（等待中/上传中/成功/失败），
/// 并对外暴露 [start] 启动整批上传、[retryFailed] 仅重试失败任务。
/// 两者复用同一套「单任务自动重试 3 次 + 指数退避」策略。
class UploadQueue extends ChangeNotifier {
  final UploadService service;

  UploadQueue({required this.service});

  final List<UploadTask> _tasks = [];

  bool _cancelled = false;
  CancelToken? _cancelToken;

  /// 当前任务列表（只读视图）
  List<UploadTask> get tasks => List.unmodifiable(_tasks);

  /// 当前批次是否已被取消（用于调用方判断是否要跳过结果回传）。
  bool get isCancelled => _cancelled;

  /// 启动一批新的上传任务。
  ///
  /// 会清空并重新初始化任务列表，随后按顺序串行处理每个任务。
  Future<void> start(List<AssetEntity> assets) async {
    _cancelled = false;
    _cancelToken = CancelToken();
    _tasks
      ..clear()
      ..addAll(assets.map((a) => UploadTask(asset: a)));
    notifyListeners();

    for (final task in _tasks) {
      if (_cancelled) break;
      await _processTask(task);
    }
  }

  /// 仅重新处理当前状态为失败的任务，不影响成功或等待中的任务。
  Future<void> retryFailed() async {
    final failedTasks =
        _tasks.where((t) => t.status == UploadTaskStatus.failed).toList();

    for (final task in failedTasks) {
      task
        ..status = UploadTaskStatus.waiting
        ..progress = 0.0
        ..error = null;
    }
    notifyListeners();

    for (final task in failedTasks) {
      if (_cancelled) break;
      await _processTask(task);
    }
  }

  /// 整体取消当前批次：中止正在进行的网络请求，停止后续任务处理，
  /// 将所有等待中/上传中的任务标记为已取消。幂等，可安全重复调用。
  void cancel() {
    if (_cancelled) return;
    _cancelled = true;
    _cancelToken?.cancel();

    for (final task in _tasks) {
      if (task.status == UploadTaskStatus.waiting ||
          task.status == UploadTaskStatus.uploading) {
        task.status = UploadTaskStatus.cancelled;
      }
    }
    notifyListeners();
  }

  /// 处理单个任务：MD5 → 秒传判断 → 上传。
  ///
  /// 失败自动重试：最多重试 3 次（共至多 4 次尝试），指数退避 1s/2s/4s。
  /// 全部重试用尽仍失败后，任务状态更新为 failed 并记录 error。
  Future<void> _processTask(UploadTask task) async {
    final asset = task.asset;

    final file = await asset.originFile;
    if (file == null) {
      task
        ..status = UploadTaskStatus.failed
        ..error = 'originFile is null';
      notifyListeners();
      return;
    }

    String fileMd5;
    try {
      fileMd5 = await service.computeMd5(file);
    } catch (e) {
      if (_cancelled) return;
      task
        ..status = UploadTaskStatus.failed
        ..error = e;
      notifyListeners();
      debugPrint('[UploadQueue] asset ${asset.id} MD5 failed: $e');
      return;
    }

    if (_cancelled) return;

    const maxRetries = 3;

    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      if (_cancelled) return;
      try {
        task.status = UploadTaskStatus.uploading;
        task.progress = 0.0;
        notifyListeners();

        // 秒传判断
        final existing = await service.isExist(fileMd5, cancelToken: _cancelToken);
        if (existing != null) {
          task
            ..status = UploadTaskStatus.done
            ..progress = 1.0
            ..result = UploadResult(
              assetId: asset.id,
              fileId: existing.id,
              fileUrl: existing.fileUrl,
            );
          notifyListeners();
          return;
        }

        // 实际上传
        // 进度变化超过 1% 才触发 notifyListeners，避免高频回调导致过多重建；
        // sent == total（上传完成）时无条件通知，保证最终进度一定被感知到。
        double lastNotifiedProgress = 0.0;
        final record = await service.uploadFile(
          file,
          onSendProgress: (sent, total) {
            if (total <= 0) return;
            final progress = sent / total;
            if (progress - lastNotifiedProgress >= 0.01 || sent == total) {
              lastNotifiedProgress = progress;
              task.progress = progress;
              notifyListeners();
            }
          },
          cancelToken: _cancelToken,
        );

        task
          ..status = UploadTaskStatus.done
          ..progress = 1.0
          ..result = UploadResult(
            assetId: asset.id,
            fileId: record.id,
            fileUrl: record.fileUrl,
          );
        notifyListeners();
        return;
      } catch (e) {
        if (_cancelled) return;
        if (attempt == maxRetries) {
          task
            ..status = UploadTaskStatus.failed
            ..error = e;
          notifyListeners();
          debugPrint('[UploadQueue] asset ${asset.id} failed: $e');
          return;
        }
        final backoff = Duration(seconds: 1 << attempt); // 1s, 2s, 4s
        debugPrint(
            '[UploadQueue] asset ${asset.id} attempt ${attempt + 1} failed: $e, retrying in ${backoff.inSeconds}s');
        await Future.delayed(backoff);
        if (_cancelled) return;
      }
    }
  }
}
