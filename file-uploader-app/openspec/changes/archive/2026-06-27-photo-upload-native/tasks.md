## 1. 依赖与配置

- [x] 1.1 在 `pubspec.yaml` 添加依赖：`dio`（multipart 上传 + 进度回调）、`crypto`（MD5 计算）
- [x] 1.2 新建 `lib/config/upload_config.dart`，定义常量 `kUploadPort = 38902`

## 2. 上传服务核心逻辑

- [x] 2.1 新建 `lib/services/upload_service.dart`，定义 `UploadService` 类，接收 `baseUrl` 参数
- [x] 2.2 实现 `computeMd5(File file) → Future<String>`：在调用方（串行队列）线程内同步读取文件字节流并计算 MD5，手机照片通常 3–10MB 计算 <10ms，无需独立 Isolate
- [x] 2.3 实现 `isExist(String md5) → Future<FileRecord?>`：`GET /files/isExist/:md5`（路径参数），返回 file 对象或 `null`，异常时返回 `null` 并降级为直接上传
- [x] 2.4 实现 `uploadFile(File file, {onProgress}) → Future<UploadResult>`：`POST /files/upload` multipart，携带进度回调
- [x] 2.5 实现 `uploadAssets(List<AssetEntity> assets, {onProgress, onItemDone}) → Future<List<UploadResult>>`：串行队列（最大并发 1），单张失败跳过继续

## 3. 进度 UI 组件

- [x] 3.1 新建 `lib/widgets/upload_progress_sheet.dart`，定义 `UploadProgressSheet` StatefulWidget
- [x] 3.2 实现上传列表展示：每项显示缩略图、文件名、状态（等待中 / 上传中 / 成功 / 失败）和进度条
- [x] 3.3 实现进度更新：暴露 `updateProgress(String assetId, double progress)` 和 `markDone/markFailed` 方法
- [x] 3.4 全部完成后延迟 1 秒自动收起 BottomSheet

## 4. WebViewPage 集成

- [x] 4.1 修改 `lib/pages/webview_page.dart`：从扫码 URL 中提取 host，拼接 `kUploadPort` 构造上传 `baseUrl`，存为成员变量
- [x] 4.2 修改 `_openPhotoPicker`：选完照片后不再直接回传路径，改为调用 `UploadService.uploadAssets`
- [x] 4.3 上传开始时 `showModalBottomSheet` 展示 `UploadProgressSheet`
- [x] 4.4 通过回调将进度更新实时传递给 `UploadProgressSheet`
- [x] 4.5 全部完成后检查 `mounted`，调用 `runJavaScript("window.UploadBridge_callback('${jsonEncode(results)}')")`

## 5. 验证

- [ ] 5.1 真机验证：触发 pickImage → 选照片 → 进度 BottomSheet 正常弹出并显示进度
- [ ] 5.2 验证秒传：重复上传同一张照片，第二次应跳过上传直接返回结果
- [ ] 5.3 验证失败跳过：断网条件下上传，失败文件跳过，后续文件继续上传
- [ ] 5.4 验证 Bridge 回传：Web 端 `UploadBridge_callback` 收到包含 `{ id, fileId, url }` 的 JSON 数组
