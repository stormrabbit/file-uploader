## ADDED Requirements

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
