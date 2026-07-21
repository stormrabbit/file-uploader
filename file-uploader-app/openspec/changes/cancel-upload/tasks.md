## 1. UploadService — 支持取消网络请求

- [x] 1.1 在 `lib/services/upload_service.dart` 的 `isExist(String fileMd5, {CancelToken? cancelToken})` 增加可选 `cancelToken` 参数，传给 `_dio.get(...)`。
- [x] 1.2 在 `uploadFile(File file, {ProgressCallback? onSendProgress, CancelToken? cancelToken})` 增加可选 `cancelToken` 参数，传给 `_dio.post(...)`。

## 2. UploadQueue — 整体取消能力

- [x] 2.1 在 `lib/services/upload_queue.dart` 的 `UploadTaskStatus` 新增 `cancelled` 枚举值。
- [x] 2.2 `UploadQueue` 新增私有字段 `bool _cancelled = false` 和 `CancelToken? _cancelToken`。
- [x] 2.3 `start(List<AssetEntity> assets)` 开头重置 `_cancelled = false`，并创建新的 `_cancelToken = CancelToken()`（与现有 `_tasks.clear()` 放在一起）。
- [x] 2.4 新增 `void cancel()`：置 `_cancelled = true`；调用 `_cancelToken?.cancel()`；遍历 `_tasks`，把状态为 `waiting`/`uploading` 的任务标记为 `cancelled`；调用 `notifyListeners()`。要求幂等（批次已结束或重复调用不抛异常、不产生副作用）。
- [x] 2.5 `_processTask` 在计算完 MD5 之后、进入秒传查询前，检查 `_cancelled`，为 true 则直接 `return`（不修改任务状态，因为 `cancel()` 已经统一处理了状态标记）。
- [x] 2.6 `_processTask` 的重试循环（`for (attempt...)`）在每次迭代开始处、以及 `await Future.delayed(backoff)` 之后，检查 `_cancelled`，为 true 则直接 `return`，不再继续重试。
- [x] 2.7 `_processTask` 调用 `service.isExist(...)` 与 `service.uploadFile(...)` 时传入 `_cancelToken`。
- [x] 2.8 `start()`/`retryFailed()` 的外层串行 `for` 循环，在每次迭代调用 `_processTask` 前检查 `_cancelled`，为 true 则 `break`，不再处理后续等待中的任务。

## 3. UploadProgressSheet — 取消上传按钮

- [x] 3.1 `UploadProgressSheet` 新增可选回调参数 `VoidCallback? onCancelled`。
- [x] 3.2 `_buildStatusIcon` 补充 `UploadTaskStatus.cancelled` 分支（如灰色的 `Icons.block` 或 `Icons.cancel_outlined`）。
- [x] 3.3 `_buildProgressBar` 补充 `cancelled` 状态对应文案（如"已取消"）。
- [x] 3.4 `_buildHeader` 新增「取消上传」`TextButton`：当 `tasks` 中存在 `waiting`/`uploading` 状态的任务时可点击，否则禁用/隐藏；`onPressed` 调用 `widget.queue.cancel()` 后触发 `widget.onCancelled?.call()`。
- [x] 3.5 `_buildHeader` 中"重试失败项"按钮的可用性判断保持仅统计 `failed` 状态，不包含 `cancelled`。
- [x] 3.6 `_checkAllDone` 的"全部到达终态"判断补充 `cancelled` 分支（视为终态之一），确保取消后如果用户没有主动关闭也不会卡住自动收起逻辑（作为兜底，主要关闭路径仍是 `onCancelled`）。

## 4. WebViewPage — 接入取消回调

- [x] 4.1 在 `lib/pages/webview_page.dart` 的 `_openPhotoPicker` 中，给 `UploadProgressSheet` 传入 `onCancelled: () { if (mounted) Navigator.of(context).pop(); }`，与现有 `onAllDone` 的关闭方式保持一致。
- [x] 4.2 确认取消场景下不会向 WebView Bridge 回传任何 `UploadResult`（即取消后直接返回，不执行 `queue.tasks` 中 `done` 任务结果收集与回传逻辑，或收集逻辑本身在 `start()` 提前退出后自然为空/不完整时也不触发回传）。

## 5. 验证

- [ ] 5.1 手动验证：批次上传中点击「取消上传」，正在上传的任务立即中止，后续等待中任务不再被处理，已成功任务结果保留。
- [ ] 5.2 手动验证：批次全部完成后「取消上传」按钮处于禁用/隐藏状态。
- [ ] 5.3 手动验证：取消后 BottomSheet 立即关闭，WebView 未收到任何本批次的上传结果回调。
- [ ] 5.4 手动验证：取消后的任务显示为「已取消」，与「上传失败」的任务在 UI 上有明显区分；「重试失败项」按钮不会把已取消的任务纳入统计。
- [x] 5.5 运行 `flutter analyze` 确认新增的 `UploadTaskStatus.cancelled` 枚举值在所有 `switch` 语句处都已正确处理，无新增静态检查问题。（结果：仅 2 条与本次改动无关的既有 `withOpacity` deprecation info，无新增问题）
