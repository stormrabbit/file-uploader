## Requirements

### Requirement: Stateful Upload Queue Holds Task List
系统 SHALL 提供 `UploadQueue`，作为持有一批上传任务状态的单一数据源。每个任务 SHALL 包含所属的 `AssetEntity`、当前状态（等待中/上传中/成功/失败）、上传进度（0.0–1.0）、成功时的 `UploadResult` 或失败时的错误信息。`UploadQueue` SHALL 在任务状态发生变化时通知已注册的监听者（如 UI 层），使调用方无需自行镜像维护一份状态。

#### Scenario: Starting a new batch populates task list
- **WHEN** 调用方以一批 `AssetEntity` 调用 `UploadQueue.start(assets)`
- **THEN** 队列为每个资源创建一个初始状态为等待中的任务，随后按顺序串行处理并逐一更新任务状态与进度，每次更新触发监听者通知

#### Scenario: Task reaches terminal state
- **WHEN** 某个任务完成处理（无论成功或全部自动重试用尽后失败）
- **THEN** 该任务的状态被更新为成功（并附带 `UploadResult`）或失败（并附带错误信息），队列继续处理批次中的下一个等待中任务

### Requirement: Retry Only Failed Tasks
系统 SHALL 提供 `UploadQueue.retryFailed()`，仅重新处理当前状态为失败的任务，不影响状态为成功或等待中的任务。重试时的单任务处理逻辑 SHALL 复用既有的自动重试 + 指数退避策略（最多重试 3 次，退避 1s/2s/4s；全部重试用尽仍失败则该任务重新回到失败状态）。

#### Scenario: Retrying failed tasks leaves succeeded tasks untouched
- **WHEN** 队列中存在若干成功任务和若干失败任务，调用方调用 `retryFailed()`
- **THEN** 成功任务的状态、进度、结果保持不变；失败任务被重置为等待中/上传中并重新执行 MD5 → 秒传判断 → 上传流程

#### Scenario: Retried task succeeds
- **WHEN** 一个失败任务在 `retryFailed()` 触发的处理过程中，某次尝试成功完成上传或命中秒传
- **THEN** 该任务状态更新为成功并携带对应 `UploadResult`，不再计入失败任务数量

#### Scenario: Retried task fails again after exhausting retries
- **WHEN** 一个失败任务在 `retryFailed()` 触发的处理过程中，全部重试（最多 4 次尝试）仍然失败
- **THEN** 该任务状态保持为失败，并附带最新一次的错误信息，可再次被 `retryFailed()` 选中

### Requirement: UI Exposes Retry-Failed Action
上传进度界面（`UploadProgressSheet`）SHALL 提供一个「重试失败项」操作入口。该入口 SHALL 仅当队列中存在至少一个失败任务且当前没有任务处于上传中状态时可用（可点击）；否则 SHALL 处于禁用状态。点击该入口 SHALL 触发 `UploadQueue.retryFailed()`。

#### Scenario: Button enabled when failed tasks exist and queue idle
- **WHEN** 队列中至少一个任务状态为失败，且没有任务处于上传中
- **THEN** 「重试失败项」按钮可点击

#### Scenario: Button disabled while uploading or no failures
- **WHEN** 队列中没有失败任务，或存在任务正处于上传中状态
- **THEN** 「重试失败项」按钮处于禁用状态，点击无效果

#### Scenario: Clicking button triggers retry
- **WHEN** 用户点击已启用的「重试失败项」按钮
- **THEN** 系统调用 `UploadQueue.retryFailed()`，界面根据任务状态变化实时更新展示（等待中/上传中/成功/失败）

### Requirement: Cancel Entire Upload Batch
系统 SHALL 提供 `UploadQueue.cancel()`，用于立即整体终止当前批次的上传处理。调用后，SHALL 中止当前正在进行的网络请求（秒传查询、multipart 上传），SHALL 停止串行处理循环，不再处理批次中尚未开始的等待中任务。已经到达终态（成功或重试用尽后失败）的任务 SHALL 保持其原有状态和结果不变。所有处于等待中或上传中的任务 SHALL 被标记为新增的 `cancelled` 状态。`cancel()` SHALL 是幂等的：重复调用或在批次已全部结束后调用不产生任何副作用或异常。

#### Scenario: Cancel while a task is uploading
- **WHEN** 队列中有任务正处于上传中（`uploading`），调用方调用 `queue.cancel()`
- **THEN** 该任务的网络请求被中止，状态更新为 `cancelled`；队列不再处理后续等待中的任务；`notifyListeners()` 被触发

#### Scenario: Cancel while some tasks already succeeded or permanently failed
- **WHEN** 批次中已有部分任务状态为 `done` 或 `failed`（重试用尽），调用方调用 `queue.cancel()`
- **THEN** 这些已到达终态的任务状态、进度、结果保持不变；仅 `waiting`/`uploading` 的任务被标记为 `cancelled`

#### Scenario: Cancel is idempotent after batch already finished
- **WHEN** 批次中所有任务都已到达终态（`done`/`failed`/`cancelled`），调用方再次调用 `queue.cancel()`
- **THEN** 不抛出异常，任务状态不发生任何变化

#### Scenario: Cancelled task is not eligible for retryFailed
- **WHEN** 批次中存在被取消（`cancelled`）的任务和其它重试用尽后失败（`failed`）的任务，调用方调用 `queue.retryFailed()`
- **THEN** 仅 `failed` 状态的任务被重新处理；`cancelled` 状态的任务不受影响，也不计入触发「重试失败项」按钮可用性判断的失败任务数量

### Requirement: UI Exposes Cancel-Upload Action
上传进度界面（`UploadProgressSheet`）SHALL 提供一个「取消上传」操作入口。该入口 SHALL 仅当队列中存在至少一个尚未到达终态的任务（`waiting` 或 `uploading`）时可用；当批次中所有任务均已到达终态（`done`/`failed`/`cancelled`）时 SHALL 处于禁用或隐藏状态。点击该入口 SHALL 触发 `UploadQueue.cancel()`，并通知调用方关闭上传进度界面。

#### Scenario: Cancel button available while batch in progress
- **WHEN** 队列中至少一个任务处于 `waiting` 或 `uploading`
- **THEN** 「取消上传」按钮可点击

#### Scenario: Cancel button unavailable after batch fully finished
- **WHEN** 队列中所有任务均已到达终态
- **THEN** 「取消上传」按钮处于禁用或隐藏状态，不可点击

#### Scenario: Clicking cancel button stops batch and closes the sheet
- **WHEN** 用户点击已启用的「取消上传」按钮
- **THEN** 系统调用 `UploadQueue.cancel()`，随后上传进度界面被关闭，且不会将本批次的上传结果回传给调用方
