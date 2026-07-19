## ADDED Requirements

### Requirement: Automatic Retry with Exponential Backoff for Single Asset Upload
在 `UploadService.uploadAssets` 处理单张 `AssetEntity` 的过程中，当处理流程（MD5 计算、秒传查询或实际文件上传）抛出异常时，系统 SHALL 自动重试最多 3 次（即最多 4 次尝试），并在每次重试之间使用指数递增的延迟等待（1 秒、2 秒、4 秒）。仅当所有重试均失败后，系统才 SHALL 执行既有的失败路径：记录日志并通过 `onItemDone` 回调传入 `null`，随后继续处理队列中的下一个资源。

#### Scenario: Transient failure recovers within retry budget
- **WHEN** 处理某个 `AssetEntity` 时第 1 次尝试抛出异常，第 2 次尝试（重试 1 次后）成功完成上传
- **THEN** 系统在两次尝试之间等待约 1 秒后重试，最终 `onItemDone` 被调用且传入非 null 的 `UploadResult`，且返回结果被加入 `uploadAssets` 的结果列表

#### Scenario: All retries exhausted
- **WHEN** 处理某个 `AssetEntity` 的所有尝试（1 次初始 + 3 次重试，共 4 次）均抛出异常
- **THEN** 系统在 4 次尝试之间分别等待约 1 秒、2 秒、4 秒后放弃，记录失败日志，调用 `onItemDone(assetId, null)`，且继续处理队列中的下一个 `AssetEntity`（不中断整体串行流程）

#### Scenario: External contract unchanged
- **WHEN** 调用方使用现有签名调用 `uploadAssets(assets, onProgress: ..., onItemDone: ...)`
- **THEN** 方法签名、`onProgress` 与 `onItemDone` 回调的调用时机与参数类型保持与重试功能引入前一致，调用方无需修改代码
