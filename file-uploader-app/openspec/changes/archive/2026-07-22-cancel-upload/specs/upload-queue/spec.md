## ADDED Requirements

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
