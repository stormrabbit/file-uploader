## Context

现状：`UploadService.uploadAssets`（`@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\services\upload_service.dart:164-238`）是一次性批处理方法——传入 `List<AssetEntity>`，串行处理并通过 `onProgress`/`onItemDone` 回调汇报，方法返回后内部状态（每张的成功/失败信息）不再保留。`UploadProgressSheet`（`@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\widgets\upload_progress_sheet.dart`）自己维护一份 `List<UploadItemState>` 作为纯 UI 展示状态，并不是"数据源"。`WebViewPage._openPhotoPicker`（`@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\pages\webview_page.dart:58-104`）是调用方，负责创建 sheet、await 批处理调用、回传 Bridge 结果。

已完成的 `upload-retry` capability（见 `@d:\ubw_personal\file-uploader-v2\file-uploader-app\openspec\specs\upload-retry\spec.md`）为单任务自动重试 3 次 + 指数退避，全部用尽才标记失败——这个策略本次不变，只是需要被"业务状态持有者"复用，并追加一个"手动重试失败项"的入口。

## Goals / Non-Goals

**Goals:**
- 引入 `UploadQueue`（持有状态的队列），作为上传任务的单一数据源：任务列表（`AssetEntity`、状态、进度、结果/错误）。
- `UploadQueue` 提供 `start(assets)` 启动整批处理、`retryFailed()` 仅重新处理失败任务，两者复用同一套「单任务自动重试 3 次 + 指数退避」逻辑。
- `UploadQueue` extends `ChangeNotifier`，UI 层通过 `AnimatedBuilder`/`ListenableBuilder` 订阅，替代当前 sheet 内部自行维护的镜像状态。
- `UploadProgressSheet` 新增「重试失败项」按钮，仅在存在失败任务且当前无进行中任务时可点击。
- `WebViewPage` 改为持有 `UploadQueue` 实例并传给 sheet，Bridge 回传时机调整为"当前一批任务全部到达终态"（成功或失败）。

**Non-Goals:**
- 不做失败原因分类或选择性重试策略（仍是统一重试 3 次 + 退避，不区分错误类型）。
- 不做队列的持久化（App 重启/页面销毁后队列状态丢失，仍是内存态）。
- 不支持追加新资源到已存在的队列中（`start()` 每次是全新一批，`retryFailed()` 只操作当前批次里失败的任务）；追加上传是可能的后续迭代方向。
- 不改变 Bridge 消息协议本身的字段格式（`UploadResult.toJson()` 不变）。

## Decisions

1. **数据模型**：新增 `UploadTask`（区别于现有 UI 层的 `UploadItemState`）：
   ```dart
   enum UploadTaskStatus { waiting, uploading, done, failed }

   class UploadTask {
     final AssetEntity asset;
     UploadTaskStatus status;
     double progress;
     UploadResult? result;
     Object? error;
   }
   ```
   - 理由：需要一个不依赖 Widget 生命周期的"业务状态"持有者；`UploadProgressSheet` 现有的 `UploadItemState` 是纯 UI state，职责应收窄为渲染 `UploadQueue` 暴露的 `List<UploadTask>`（或直接复用同一个类型，避免重复建模）。
   - 决定：复用/重命名现有 `UploadItemState` 为 `UploadTask` 并从 `upload_progress_sheet.dart` 移到 `upload_service.dart`（或新文件 `upload_queue.dart`），sheet 不再自己创建 state，而是直接读取 `queue.tasks`。

2. **UploadQueue 放置位置**：新建 `lib/services/upload_queue.dart`，内部持有一个 `UploadService` 实例用于底层操作（`computeMd5`/`isExist`/`uploadFile`），不再让 `UploadService` 自身承担"批处理+状态"职责。
   - 理由：单一职责——`UploadService` 只负责与服务端交互的原子操作；`UploadQueue` 负责任务列表状态与调度（含重试策略）。
   - 备选方案：直接在 `UploadService` 内部加字段持有任务列表。放弃原因：`UploadService` 当前是无状态、可能被复用于多批调用的服务对象，混入状态会让语义混乱，且不利于后续多队列/多 tab 场景扩展。

3. **对外 API**：
   ```dart
   class UploadQueue extends ChangeNotifier {
     UploadQueue({required UploadService service});

     List<UploadTask> get tasks;

     Future<void> start(List<AssetEntity> assets);
     Future<void> retryFailed();
   }
   ```
   - `start()`：清空/初始化 `tasks`，逐个串行处理（复用原 `uploadAssets` 内的单任务重试循环逻辑），每次状态变化调用 `notifyListeners()`。
   - `retryFailed()`：筛选 `status == failed` 的任务，重置为 `waiting`→逐个按同样的重试循环处理，不影响已成功/仍在等待中的任务。
   - 理由：两个方法复用同一个私有 `_processTask(UploadTask task)` 内部方法（内含单任务重试 3 次 + 指数退避），避免重复实现"重试策略"。

4. **UI 集成**：
   - `UploadProgressSheet` 构造参数从 `assets: List<AssetEntity>` 改为 `queue: UploadQueue`，内部用 `AnimatedBuilder(animation: queue, builder: ...)` 渲染 `queue.tasks`。
   - Header 区域新增「重试失败项」`TextButton`/`OutlinedButton`：`onPressed: hasFailedTasks && !isUploading ? () => queue.retryFailed() : null`。
   - `_checkAllDone` 逻辑迁移为基于 `queue.tasks` 计算是否全部终态，仍保留"全部完成后延迟 1 秒自动收起"的行为；但点击「重试失败项」后不应立即触发自动收起判断误报（因为重试期间任务状态会先变回 `uploading`/`waiting`，天然不满足"全部终态"，无需额外特殊处理）。

5. **WebViewPage 调用方改造**：
   - `_openPhotoPicker` 创建 `UploadQueue(service: _uploadService)`，`await queue.start(assets)`。
   - Bridge 回传：等待 `queue.start()` 返回后即回传当前 `tasks` 中成功任务对应的 `UploadResult` 列表（与现状一致，即首次全部处理完成时回传一次）。
   - 后续用户点击「重试失败项」不会重新触发 Bridge 回传（回传只发生一次，在首次 `start()` 完成时）；如果需要重试后再回传，属于后续增强，本次不做（保持"改动聚焦"）。

## Risks / Trade-offs

- **[风险] Bridge 回传时机语义变化空间** → 首次 `start()` 完成后即回传一次结果（同现状行为），重试失败项发生在回传之后，Web 端不会再收到新的回调。**缓解**：在 design 中明确此为 Non-Goal，若后续需要"重试后更新 Web 端"，作为独立变更提出。
- **[风险] UploadTask 与旧 UploadItemState 重命名影响现有代码** → `upload_progress_sheet.dart` 中所有引用 `UploadItemState`/`UploadItemStatus` 的地方需要同步替换为 `UploadTask`/`UploadTaskStatus`（或做类型别名过渡）。**缓解**：在 tasks.md 中列出显式的重命名/迁移步骤，一次性完成，避免遗留两套并行类型。
- **[风险] 队列内存态、无持久化** → App 被杀或页面销毁后重试信息丢失。**缓解**：明确列为 Non-Goal，当前不处理。
- **[权衡] `UploadService.uploadAssets` 是否保留** → 决定：迁移其内部逻辑到 `UploadQueue._processTask`/`start`/`retryFailed`，`uploadAssets` 方法本身可删除（无其他调用方，`WebViewPage` 是唯一调用点，同批次改造）。
