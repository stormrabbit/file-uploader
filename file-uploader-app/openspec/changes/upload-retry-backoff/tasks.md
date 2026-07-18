## 1. 实现重试逻辑

- [x] 1.1 在 `@d:\ubw_personal\file-uploader-v2\file-uploader-app\lib\services\upload_service.dart` 的 `uploadAssets` 方法内，为单张 `AssetEntity` 的处理逻辑（读取文件 → MD5 → 秒传判断 → uploadFile）增加重试循环：最多 3 次重试（共至多 4 次尝试）。
- [x] 1.2 在每次重试之间加入指数退避延迟：1s、2s、4s（使用 `Future.delayed`）。
- [x] 1.3 仅当全部尝试失败后，才保留现有失败处理逻辑：记录日志（`debugPrint`）并调用 `onItemDone(asset.id, null)`，且不中断整体串行循环（继续处理下一个 asset）。
- [x] 1.4 确保 `uploadAssets` 方法签名、`onProgress`、`onItemDone` 回调的参数类型与调用时机保持不变。

## 2. 验证

- [x] 2.1 检查/编写测试或手动验证：模拟单次或两次失败后成功的场景，确认最终返回非 null 的 `UploadResult` 且未提前放弃。
- [x] 2.2 检查/编写测试或手动验证：模拟持续失败场景，确认在 4 次尝试后才调用 `onItemDone(assetId, null)`，且退避延迟顺序符合 1s/2s/4s。
- [ ] 2.3 运行 `flutter analyze`（或项目现有 lint/test 命令）确认无新增静态检查问题。（当前环境未找到 `flutter` 命令，待用户在有 Flutter 环境的终端手动运行）
