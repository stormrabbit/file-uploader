import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';

import '../config/upload_config.dart';

/// 服务端文件记录（isExist / upload 接口返回结构）
class FileRecord {
  final int id;
  final String fileName;
  final String fileUrl;
  final String fileMd5;

  const FileRecord({
    required this.id,
    required this.fileName,
    required this.fileUrl,
    required this.fileMd5,
  });

  factory FileRecord.fromJson(Map<String, dynamic> json) {
    return FileRecord(
      id: (json['id'] as num).toInt(),
      fileName: json['fileName'] as String? ?? '',
      fileUrl: json['fileUrl'] as String? ?? '',
      fileMd5: json['fileMd5'] as String? ?? '',
    );
  }
}

/// 单张照片的上传结果
class UploadResult {
  /// PhotoPickerPage 回传的 AssetEntity.id
  final String assetId;

  /// 服务端 file 记录 id
  final int fileId;

  /// 服务端相对路径，如 /static/2024-01-01/photo.jpg
  final String fileUrl;

  const UploadResult({
    required this.assetId,
    required this.fileId,
    required this.fileUrl,
  });

  Map<String, dynamic> toJson() => {
        'id': assetId,
        'fileId': fileId,
        'fileUrl': fileUrl,
      };
}

/// 进度回调类型
///
/// [assetId]  当前处理的 asset id
/// [progress] 0.0–1.0，上传进度
typedef UploadProgressCallback = void Function(String assetId, double progress);

/// 单张完成回调类型
///
/// [result] 成功时非 null，失败时为 null
typedef UploadItemDoneCallback = void Function(
    String assetId, UploadResult? result);

/// App 原生上传服务
///
/// 负责 MD5 计算、秒传判断、multipart 上传，以及串行队列控制。
class UploadService {
  final String baseUrl;

  late final Dio _dio;

  UploadService({required this.baseUrl}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout:
            const Duration(seconds: kUploadConnectTimeoutSeconds),
        receiveTimeout:
            const Duration(seconds: kUploadReceiveTimeoutSeconds),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Task 2.2 — MD5 计算
  // ---------------------------------------------------------------------------

  /// 同步读取文件字节流计算 MD5。
  ///
  /// 在串行上传队列内调用，每次仅处理 1 张图，
  /// 手机照片通常 3–10MB，计算耗时 <10ms，不会阻塞 UI。
  Future<String> computeMd5(File file) async {
    final bytes = await file.readAsBytes();
    return md5.convert(bytes).toString();
  }

  // ---------------------------------------------------------------------------
  // Task 2.3 — 秒传判断
  // ---------------------------------------------------------------------------

  /// 查询服务端是否已存在该 MD5 的文件。
  ///
  /// 服务端返回一层包装结构 `{ code, data, message }`：
  /// - `data` 为完整 file 对象（含 id）表示已存在
  /// - `data` 为空对象 `{}` 表示不存在
  /// 网络异常时返回 null，降级为直接上传。
  Future<FileRecord?> isExist(String fileMd5) async {
    try {
      final resp = await _dio.get('/files/isExist/$fileMd5');
      final data = (resp.data as Map<String, dynamic>?)?['data'];
      if (data == null) return null;
      final dataMap = data as Map<String, dynamic>;
      // data 为空对象 {} 表示文件不存在
      if (!dataMap.containsKey('id')) return null;
      return FileRecord.fromJson(dataMap);
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Task 2.4 — multipart 上传
  // ---------------------------------------------------------------------------

  /// 以 multipart/form-data 上传文件，支持进度回调。
  ///
  /// 服务端返回 `{ code, data, message }` 包装结构，返回 [FileRecord]，失败时抛出异常。
  Future<FileRecord> uploadFile(
    File file, {
    ProgressCallback? onSendProgress,
  }) async {
    final fileName = file.path.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
    });

    final resp = await _dio.post(
      '/files/upload',
      data: formData,
      onSendProgress: onSendProgress,
    );
    final data = (resp.data as Map<String, dynamic>)['data']
        as Map<String, dynamic>;
    return FileRecord.fromJson(data);
  }

  // ---------------------------------------------------------------------------
  // Task 2.5 — 串行上传队列（最大并发 1）
  // ---------------------------------------------------------------------------

  /// 串行上传一批 AssetEntity。
  ///
  /// 每张照片按顺序执行：MD5 → 秒传判断 → 上传。
  /// 单张失败时跳过，继续处理下一张。
  ///
  /// [onProgress]  实时上传进度（0.0–1.0）
  /// [onItemDone]  每张完成/失败的回调
  Future<List<UploadResult>> uploadAssets(
    List<AssetEntity> assets, {
    UploadProgressCallback? onProgress,
    UploadItemDoneCallback? onItemDone,
  }) async {
    final results = <UploadResult>[];

    // 串行处理，最大并发 1
    for (final asset in assets) {
      try {
        final file = await asset.originFile;
        if (file == null) {
          onItemDone?.call(asset.id, null);
          continue;
        }

        // 失败自动重试：最多重试 3 次（共至多 4 次尝试），指数退避 1s/2s/4s
        const maxRetries = 3;
        UploadResult? result;

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // 通知开始（progress = 0）
            onProgress?.call(asset.id, 0.0);

            // MD5 计算
            final fileMd5 = await computeMd5(file);

            // 秒传判断
            final existing = await isExist(fileMd5);
            if (existing != null) {
              result = UploadResult(
                assetId: asset.id,
                fileId: existing.id,
                fileUrl: existing.fileUrl,
              );
              onProgress?.call(asset.id, 1.0);
              break;
            }

            // 实际上传
            final record = await uploadFile(
              file,
              onSendProgress: (sent, total) {
                if (total > 0) {
                  onProgress?.call(asset.id, sent / total);
                }
              },
            );

            result = UploadResult(
              assetId: asset.id,
              fileId: record.id,
              fileUrl: record.fileUrl,
            );
            break;
          } catch (e) {
            if (attempt == maxRetries) {
              rethrow;
            }
            final backoff = Duration(seconds: 1 << attempt); // 1s, 2s, 4s
            debugPrint(
                '[UploadService] asset ${asset.id} attempt ${attempt + 1} failed: $e, retrying in ${backoff.inSeconds}s');
            await Future.delayed(backoff);
          }
        }

        results.add(result!);
        onItemDone?.call(asset.id, result);
      } catch (e) {
        // 全部重试用尽仍失败：记录日志，跳过该文件
        debugPrint('[UploadService] asset ${asset.id} failed: $e');
        onItemDone?.call(asset.id, null);
      }
    }

    return results;
  }
}
