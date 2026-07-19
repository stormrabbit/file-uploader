import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';

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
}
