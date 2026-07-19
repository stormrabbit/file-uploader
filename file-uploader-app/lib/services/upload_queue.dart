import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';

import 'upload_service.dart';

/// 单个上传任务的状态
enum UploadTaskStatus { waiting, uploading, done, failed }

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

  /// 当前任务列表（只读视图）
  List<UploadTask> get tasks => List.unmodifiable(_tasks);

  /// 启动一批新的上传任务。
  ///
  /// 会清空并重新初始化任务列表，随后按顺序串行处理每个任务。
  Future<void> start(List<AssetEntity> assets) async {
    _tasks
      ..clear()
      ..addAll(assets.map((a) => UploadTask(asset: a)));
    notifyListeners();

    for (final task in _tasks) {
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
      await _processTask(task);
    }
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

    const maxRetries = 3;

    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        task.status = UploadTaskStatus.uploading;
        task.progress = 0.0;
        notifyListeners();

        // MD5 计算
        final fileMd5 = await service.computeMd5(file);

        // 秒传判断
        final existing = await service.isExist(fileMd5);
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
        final record = await service.uploadFile(
          file,
          onSendProgress: (sent, total) {
            if (total > 0) {
              task.progress = sent / total;
              notifyListeners();
            }
          },
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
      }
    }
  }
}
