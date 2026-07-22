## Context

`UploadQueue`（`lib/services/upload_queue.dart`）目前以 `start()`/`retryFailed()` 串行处理任务列表，单任务处理逻辑集中在 `_processTask()` 内，包含：获取 `originFile` → `computeMd5`（isolate 计算）→ `isExist` 秒传查询 → `uploadFile`（multipart 上传，带指数退避重试，最多 3 次）。整个批次由 `UploadProgressSheet` 以 `isDismissible: false` 的 `showModalBottomSheet` 展示，用户当前没有任何方式中止流程。

`UploadService.uploadFile` 底层使用 `dio`，`dio` 原生支持 `CancelToken` 用于中止正在进行的请求（会抛出 `DioException` 且 `type == DioExceptionType.cancel`）。

## Goals / Non-Goals

**Goals:**
- 用户可以在批次上传进行到任意阶段（等待中/正在计算 MD5/正在查询秒传/正在上传/重试等待中）点击「取消上传」，让整批操作尽快停止。
- 已经成功或失败（重试用尽）的任务保留原有终态和结果，不因取消而被覆盖。
- 取消操作是幂等的：重复调用 `cancel()`、或在已经全部完成后调用，不产生副作用或异常。
- 取消后 UI 能立即感知并关闭 BottomSheet，不需要用户等待。

**Non-Goals:**
- 不支持取消队列中单个任务（本次只做整体取消）。
- 不支持"取消后继续/恢复"——取消即结束当前批次，用户需要重新选择照片、发起新的 `start()` 调用才能再次上传。
- 不处理服务端的 orphan 文件清理（若 multipart 上传已经在服务端写入部分数据后被取消，清理逻辑不在本次范围）。

## Decisions

### 1. 取消信号的载体：`bool _cancelled` 标志位 + 单个共享 `CancelToken`
`UploadQueue` 内部维护一个 `bool _cancelled` 标志和一个当前批次共享的 `CancelToken? _cancelToken`（每次 `start()` 时重新创建）。`cancel()` 方法：
1. 置 `_cancelled = true`；
2. 调用 `_cancelToken?.cancel()` 中止当前正在进行的 HTTP 请求（`isExist`/`uploadFile`）；
3. 遍历 `_tasks`，把所有仍处于 `waiting`/`uploading` 的任务状态改为 `cancelled`；
4. `notifyListeners()`。

`_processTask` 的重试循环在每次进入循环体、以及 `Future.delayed(backoff)` 之后都检查 `_cancelled`，一旦为 true 立即 `return`（不再继续重试、不再执行剩余逻辑）。`start()`/`retryFailed()` 的外层串行 for 循环也在每次迭代前检查 `_cancelled`，为 true 则停止处理后续等待中的任务。

**为什么不用"每个任务各自一个 CancelToken"**：本次只做整体取消，一个批次共享一个 token 已经足够；对外暴露的公共 API 也更简单（`cancel()` 无参数）。若未来要支持单任务取消，可以在此基础上扩展为 `Map<String, CancelToken>`，不影响现在的接口形状。

**为什么不用 `Future` 层面的 "cancel by throwing"（如包一层能取消的 Future）**：Dart 的 `Future` 本身不支持取消，硬包一层容易导致资源泄漏（比如底层 HTTP 连接仍在跑）；直接用 `dio` 原生 `CancelToken` 更贴近真实中止网络请求的语义，且 `computeMd5` 走的是纯本地 isolate 计算，本身耗时很短（文档注释里提到手机照片 <10ms），不值得为它单独实现取消，取消检查点放在 MD5 计算完成之后即可覆盖绝大多数场景。

### 2. 新增 `UploadTaskStatus.cancelled`，不复用 `failed`
新增独立状态而不是把取消也标记为 `failed`，原因：
- 语义不同：`failed` 表示"重试用尽仍失败"，`cancelled` 表示"用户主动终止"，UI 文案、图标应该有区分（比如 `failed` 显示"上传失败"+红色错误图标，`cancelled` 显示"已取消"+中性图标），且不希望用户对着一堆"失败"任务点「重试失败项」结果发现是自己主动取消的。
- 现有「重试失败项」按钮的可用性判断（`failedCount > 0 && !hasUploading`）不应该把 `cancelled` 的任务纳入可重试范围——取消是用户的主动意图，不应被自动/一键重试覆盖。

**Trade-off**：`UploadTaskStatus` 是一个 `enum`，新增枚举值后，所有对它做 `switch` 的地方（目前只有 `upload_progress_sheet.dart` 的 `_buildStatusIcon`）编译期会报错强制补全分支，这是期望的行为（避免遗漏），不算风险。

### 3. UI 交互：取消按钮位置与关闭时机
在 `UploadProgressSheet` 的 header 区域（`_buildHeader`）新增「取消上传」按钮，与「重试失败项」并列。可用性规则：只要队列中存在未到达终态的任务（`waiting`/`uploading`）就可点击；全部任务已到达终态（`done`/`failed`/`cancelled`）时隐藏或禁用（此时用户应该用已有的"全部完成后自动收起"流程，不需要再取消）。

点击后：
1. 调用 `widget.queue.cancel()`；
2. 通过新增的 `onCancelled` 回调通知 `webview_page.dart`，由它负责 `Navigator.pop` 关闭 BottomSheet（复用现有 `onAllDone` 的关闭方式，保持两条路径一致，不在 Sheet 内部直接调用 `Navigator.pop`，因为 Sheet 本身不持有 `BuildContext` 的路由归属语义，交给创建者处理更符合现有代码风格）。

取消后不会触发 `_checkAllDone` 的"1 秒后自动关闭"逻辑（那是给"正常跑完"设计的），而是立即关闭，因为用户已经明确表达了"现在就停止"的意图。

### 4. `uploadFile` 的 `CancelToken` 参数
`UploadService.uploadFile` 新增可选具名参数 `CancelToken? cancelToken`，直接传给 `dio.post(..., cancelToken: cancelToken)`。`isExist` 同样接受可选 `cancelToken`（秒传查询请求也可能在取消时正在进行）。默认值为 `null`，保持向后兼容（现有单测/调用方不传时行为不变）。

## Risks / Trade-offs

- **[风险] 取消发生在 `originFile`/`computeMd5` 等本地异步操作进行中，无法立即中止** → **缓解**：这些操作本身耗时很短（文件读取 + isolate 哈希计算，文档注明手机照片场景 <10ms），取消检查点设在这些操作**完成之后**、下一步网络请求**发起之前**，用户感知到的延迟可忽略；真正耗时的网络上传通过 `CancelToken` 可以立即中止。
- **[风险] 取消时 multipart 上传已经把部分数据发到服务端，服务端可能残留未完成的临时文件** → **缓解**：本次不处理服务端清理（Non-Goal），服务端 `isExist`/秒传机制本身要求完整文件 MD5 匹配，残留的不完整文件不会被误认为"已存在"，后续可由服务端定期清理未完成上传，不阻塞本次前端改动。
- **[风险] `_cancelled` 标志位在批次之间没有正确重置，导致下一批 `start()` 一开始就被当作已取消** → **缓解**：`start()` 开头显式重置 `_cancelled = false` 并重新创建 `_cancelToken`，与现有 `_tasks.clear()` 放在同一处，保证每次新批次都是干净状态。
- **[Trade-off] 只做整体取消，不支持单任务取消** → 符合本次代理需求范围（"目前先做整体取消"），后续若需要单任务取消，可在现有 `Map<String, CancelToken>` 扩展点上增量实现，不需要推翻现有设计。
