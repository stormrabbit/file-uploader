import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config/upload_config.dart';

/// 在独立 isolate 中计算文件 MD5，供 [UploadService.computeMd5] 通过 [compute] 调用。
///
/// 必须是顶层函数（或 static 方法），因为 [compute] 会把它发送到新的 isolate 执行，
/// isolate 之间不能共享闭包/实例状态，只能传递可序列化的参数（此处为文件路径）。
String _computeMd5InBackground(String filePath) {
  final bytes = File(filePath).readAsBytesSync();
  return md5.convert(bytes).toString();
}

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

/// App 原生上传服务
///
/// 负责 MD5 计算、秒传判断、multipart 上传等原子操作。
/// 批量任务的状态与串行调度由 [UploadQueue] 负责。
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

  /// 在独立 isolate 中计算文件 MD5，不阻塞 UI 线程（主 isolate）。
  ///
  /// 使用 [compute] 将读取文件字节 + 哈希计算都放到后台 isolate 执行，
  /// 因此即使遇到较大文件（视频等）也不会造成主线程卡顿。
  /// 由于 isolate 间只能传递可序列化数据，这里传的是文件路径而非 [File] 实例。
  Future<String> computeMd5(File file) async {
    return compute(_computeMd5InBackground, file.path);
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
  Future<FileRecord?> isExist(String fileMd5, {CancelToken? cancelToken}) async {
    try {
      final resp = await _dio.get(
        '/files/isExist/$fileMd5',
        cancelToken: cancelToken,
      );
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
    CancelToken? cancelToken,
  }) async {
    final fileName = file.path.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
    });

    final resp = await _dio.post(
      '/files/upload',
      data: formData,
      onSendProgress: onSendProgress,
      cancelToken: cancelToken,
    );
    final data = (resp.data as Map<String, dynamic>)['data']
        as Map<String, dynamic>;
    return FileRecord.fromJson(data);
  }
}
