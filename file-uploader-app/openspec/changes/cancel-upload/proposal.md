## Why

当前 `UploadQueue` 一旦通过 `start()` 启动整批上传，用户没有任何方式中途停止：上传进度 `BottomSheet` 以 `isDismissible: false` 弹出（见 `webview_page.dart`），用户只能等待全部任务到达终态（成功/失败）后才能关闭。如果用户选错了照片、网络状况很差想先中止，或者只是想不上传了，目前唯一的办法是强制退出 App。需要提供一个「取消上传」入口，允许用户随时整体终止当前批次的上传。

## What Changes

- 在 `UploadQueue` 新增整体取消能力：
  - 新增 `UploadTaskStatus.cancelled` 状态，与 `failed` 区分「主动取消」和「重试用尽后失败」。
  - 新增 `UploadQueue.cancel()` 方法：立即停止串行处理循环（不再处理后续等待中的任务），并中止当前正在进行的网络请求（MD5 计算、秒传查询、multipart 上传均可能处于进行中）。
  - 已经到达终态（`done`/`failed`）的任务不受取消影响，保留原有结果；`waiting` 中的任务直接标记为 `cancelled`；当前 `uploading` 的任务在其请求被中止后标记为 `cancelled`。
  - 取消后不会触发自动重试逻辑（重试循环需感知取消信号并提前退出，不再等待下一次 backoff）。
- `UploadService.uploadFile` 支持外部传入 `CancelToken`，用于中止正在进行的 multipart 上传请求。
- `UploadProgressSheet` 新增「取消上传」按钮：
  - 队列中存在未到达终态的任务（`waiting`/`uploading`）时可点击；全部任务已到达终态时禁用/隐藏。
  - 点击后调用 `queue.cancel()`，并关闭 BottomSheet（`webview_page.dart` 中的 `showModalBottomSheet` 需要监听取消回调来 `Navigator.pop`）。
- `webview_page.dart` 中 `_openPhotoPicker` 增加取消回调处理：取消后不回传任何 `UploadResult` 给 WebView Bridge（视为本次批量上传未完成，保留后续可重新选择照片再次上传的入口）。

本次先只实现「整体取消」（取消当前批次全部未完成任务），不做单张任务的单独取消。

## Capabilities

### New Capabilities

（无——本次是对现有 `upload-queue` 能力的行为扩展，不引入新能力）

### Modified Capabilities

- `upload-queue`: 新增「整体取消上传」需求：`UploadQueue.cancel()` 的行为、`cancelled` 状态的语义、以及 `UploadProgressSheet` 的取消入口可用性规则。

## Impact

- **代码**：
  - `lib/services/upload_queue.dart`：新增 `cancelled` 状态、`cancel()` 方法、取消信号在 `_processTask` 重试循环中的检查点。
  - `lib/services/upload_service.dart`：`uploadFile` 增加可选 `CancelToken` 参数。
  - `lib/widgets/upload_progress_sheet.dart`：新增取消按钮、`cancelled` 状态对应的图标/文案、`onCancelled` 回调。
  - `lib/pages/webview_page.dart`：接入取消回调，关闭 BottomSheet。
- **依赖**：复用现有 `dio` 的 `CancelToken` 机制，无新增第三方依赖。
- **无破坏性变更**：现有 `start()`/`retryFailed()` 行为不变，`cancelled` 是新增枚举值，现有代码中对 `UploadTaskStatus` 的 `switch` 语句需要补充这一分支（Dart 编译期会强制要求处理，不会静默遗漏）。
