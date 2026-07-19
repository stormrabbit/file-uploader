## 1. UploadQueue 数据模型与核心逻辑

- [x] 1.1 新建 `lib/services/upload_queue.dart`：定义 `UploadTaskStatus`（waiting/uploading/done/failed）与 `UploadTask`（asset、status、progress、result、error）。
- [x] 1.2 实现 `UploadQueue extends ChangeNotifier`，构造时接收 `UploadService` 实例；暴露 `List<UploadTask> get tasks`（只读视图）。
- [x] 1.3 实现私有方法 `_processTask(UploadTask task)`：复用现有单任务重试逻辑（MD5 → 秒传判断 → uploadFile，失败自动重试最多 3 次，指数退避 1s/2s/4s），每次状态/进度变化调用 `notifyListeners()`。
- [x] 1.4 实现 `Future<void> start(List<AssetEntity> assets)`：清空并初始化任务列表（全部为 waiting），随后串行调用 `_processTask` 处理每个任务。
- [x] 1.5 实现 `Future<void> retryFailed()`：筛选 `status == failed` 的任务，重置为 waiting 后串行调用 `_processTask` 重新处理，不影响其他任务。

## 2. 迁移/清理 UploadService

- [x] 2.1 从 `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\services\upload_service.dart` 中移除 `uploadAssets` 方法及其相关 typedef（`UploadProgressCallback`、`UploadItemDoneCallback`），逻辑已迁移到 `UploadQueue`。
- [x] 2.2 保留 `UploadService` 中的 `computeMd5`、`isExist`、`uploadFile` 等原子方法不变。

## 3. UploadProgressSheet 改造

- [x] 3.1 将 `UploadProgressSheet` 构造参数由 `assets: List<AssetEntity>` 改为 `queue: UploadQueue`；移除内部自行维护的 `_items`/`UploadItemState`/`UploadItemStatus`，改为读取 `queue.tasks`。
- [x] 3.2 使用 `AnimatedBuilder`（或 `ListenableBuilder`）包裹 build 内容，监听 `queue` 变化驱动 UI 刷新；移除 `updateProgress`/`markDone`/`markFailed` 等旧的手动状态更新方法（不再需要，由 `UploadQueue` 驱动）。
- [x] 3.3 在 header 区域新增「重试失败项」按钮：当 `queue.tasks` 中存在 `failed` 且没有 `uploading` 状态时启用，`onPressed` 调用 `queue.retryFailed()`；否则禁用。
- [x] 3.4 调整 `_checkAllDone` 逻辑基于 `queue.tasks` 计算"是否全部到达终态（done/failed）"，保持全部完成后延迟 1 秒自动收起的既有行为。

## 4. WebViewPage 调用方改造

- [x] 4.1 在 `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\pages\webview_page.dart` 的 `_openPhotoPicker` 中创建 `UploadQueue(service: _uploadService)`，替换原先直接调用 `_uploadService.uploadAssets(...)` 的逻辑。
- [x] 4.2 将 `UploadProgressSheet` 的构造改为传入 `queue` 而非 `assets`；调用 `await queue.start(assets)` 驱动上传。
- [x] 4.3 `queue.start()` 完成后，基于 `queue.tasks` 中状态为 `done` 的任务收集 `UploadResult` 列表，保持现有 Bridge 回传逻辑（`window.UploadBridge_callback`）不变。

## 5. 验证

- [x] 5.1 手动/单测验证：`retryFailed()` 仅重新处理失败任务，成功任务的状态与结果不受影响。
- [x] 5.2 手动/单测验证：「重试失败项」按钮在无失败任务或存在上传中任务时禁用，仅在存在失败任务且队列空闲时启用。
- [x] 5.3 手动/单测验证：`start()` 与 `retryFailed()` 均正确套用自动重试 3 次 + 指数退避 1s/2s/4s 策略。
- [x] 5.4 运行 `flutter analyze`（或项目现有 lint/test 命令）确认无新增静态检查问题，重点检查旧类型（`UploadItemState`/`UploadItemStatus`/`uploadAssets`）不再被任何文件引用。
