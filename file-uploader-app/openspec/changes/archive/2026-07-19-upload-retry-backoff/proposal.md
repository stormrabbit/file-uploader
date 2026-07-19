## Why

`UploadService.uploadAssets` 当前单张上传失败（MD5 计算、秒传查询、`uploadFile` 请求任一环节抛出异常）会直接跳过并调用 `onItemDone(assetId, null)` 标记失败，即便失败原因是可恢复的网络抖动或服务端瞬时错误。用户需要手动重新选择照片重试，体验差。为提升上传成功率，在不改变整体串行队列结构和外部回调契约的前提下，为单张上传增加自动重试。

## What Changes

- 在 `uploadAssets` 的单张 `try/catch` 内部，将 MD5 计算 → 秒传判断 → 实际上传的流程包装为可重试单元。
- 失败时自动重试，最多 3 次（即最多 4 次尝试：1 次初始 + 3 次重试），每次重试之间使用指数退避延迟（如 1s、2s、4s）。
- 仅当全部重试用尽仍失败时，才执行原有失败路径（记录日志 + `onItemDone(assetId, null)`）。
- 不改变 `uploadAssets`、`onProgress`、`onItemDone` 的对外签名与调用方式；不改变整体串行处理多个 asset 的顺序逻辑。
- 重试过程中的进度回调行为保持与现有单次尝试一致（每次重试重新从 0.0 开始上报进度）。

## Capabilities

### New Capabilities
- `upload-retry`: 单张资源上传失败时的自动重试与指数退避策略

### Modified Capabilities
(none — 当前 repo 无既有 upload 相关 spec 记录此行为)

## Impact

- 代码：`@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\services\upload_service.dart` 中 `uploadAssets` 方法内部逻辑。
- 无 API 契约变化，无新增依赖。
- 上传总耗时在失败重试场景下可能增加（受退避延迟影响）。
