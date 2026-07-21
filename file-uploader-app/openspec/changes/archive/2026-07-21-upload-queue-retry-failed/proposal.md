## Why

当前 `UploadService.uploadAssets` 是一次性的无状态方法：调用方传入资源列表，方法内部串行处理并通过回调汇报进度/结果，处理完毕后 `results`/内部状态即丢弃。当某张资源的全部自动重试（`upload-retry` capability）用尽仍失败时，用户唯一的补救方式是重新打开相册选择器、重新选择照片、重新触发整批上传——即使其中大部分照片已经成功上传。这既浪费流量，也造成困惑（是否会重复上传已成功的照片）。

需要让上传流程具备可持有的状态（每个任务当前处于等待/上传中/成功/失败，及其归属的 `AssetEntity`），从而支持"只重试失败项"这一有意义的操作，并让 UI 能够呈现一个「重试失败项」按钮。

## What Changes

- 新增 `UploadQueue`：持有一批上传任务（`UploadTask`：asset、status、progress、result、error）的状态容器，替代 `UploadService.uploadAssets` 一次性处理的模式。
- `UploadQueue` 对外暴露：
  - 启动方法（如 `start(assets)`）：初始化任务列表并串行处理，复用现有 MD5 → 秒传判断 → 上传 → 失败自动重试（3 次 + 指数退避）逻辑。
  - `retryFailed()`：仅重新处理当前状态为 `failed` 的任务，其余任务（成功/等待中）不受影响，同样套用自动重试 + 指数退避策略。
  - 状态变化通知（如 `ChangeNotifier`/`Listenable`），供 UI 订阅任务列表快照。
- `UploadService` 保留底层原子能力（`computeMd5`、`isExist`、`uploadFile`），供 `UploadQueue` 内部调用；不再由页面直接调用一次性的 `uploadAssets` 批处理入口（该方法可保留兼容旧调用方或按需移除，具体见 design）。
- `UploadProgressSheet` 增加「重试失败项」按钮：仅当存在状态为失败的任务且当前没有正在进行的上传时可点击；点击后调用 `UploadQueue.retryFailed()`，并让已完成/等待中的任务保持原状态不被重置。
- `WebViewPage`（或其他调用方）改为创建并持有一个 `UploadQueue` 实例，监听其状态变化驱动 `UploadProgressSheet` 更新，而不是直接 await 一次性批处理调用。

## Capabilities

### New Capabilities
- `upload-queue`: 持有状态的上传任务队列，支持启动批量上传与仅重试失败项

### Modified Capabilities
(none — `upload-retry` capability 定义的单任务自动重试+退避策略保持不变，仅被 `upload-queue` 复用，不修改其需求文本)

## Impact

- 代码：
  - `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\services\upload_service.dart`：新增/重构为 `UploadQueue`（或新文件 `upload_queue.dart`），原 `uploadAssets` 批处理逻辑迁移为队列内部实现。
  - `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\widgets\upload_progress_sheet.dart`：新增「重试失败项」按钮及对应交互逻辑。
  - `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\pages\webview_page.dart`：改为创建/持有 `UploadQueue`，绑定 UI 回调。
- 无新增第三方依赖（复用 Flutter 内置 `ChangeNotifier`/`Listenable` 机制）。
- 对外 Bridge 回传逻辑（`window.UploadBridge_callback`）的调用时机可能需要调整为"全部任务终态（成功或失败，且未再手动重试）"才回传，具体行为在 design 中明确。
