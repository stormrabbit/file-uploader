## Context

当前 `WebViewPage` 的 `_onBridgeMessage` 在收到 `pickImage` 消息后仅弹出一个确认 Dialog（阶段一验证）。本次需要将其替换为真实的原生相册选择器，支持多种批量选择模式，并在用户确认后将文件信息回传给 Web 端。

现有技术栈：Flutter + `webview_flutter ^4.2.0`。需要新增 `photo_manager` 作为相册访问层，它提供跨平台的相册/资产访问 API，无需 `image_picker`（后者不支持批量/影集维度的选择）。

## Goals / Non-Goals

**Goals:**
- 新增 `PhotoPickerPage`，支持：逐张勾选、按日期全选、按影集全选、一键全选
- 替换 `_showBridgeDialog`，完成 Bridge → 选择器 → 回传 的完整链路
- 所选照片的本地 URI 以 JSON 数组形式通过 `window.UploadBridge_callback` 注入 WebView

**Non-Goals:**
- 不实现文件上传本身（上传由 Web 端处理）
- 不支持视频选择
- 不实现照片预览大图
- 不处理云端（iCloud/Google Photos）照片同步

## Decisions

### D1：使用 `photo_manager` 而非 `image_picker`

`image_picker` 的多选模式依赖系统 UI，无法自定义批量选择维度（日期/影集）。`photo_manager` 提供 `AssetPathEntity`（影集）和 `AssetEntity`（单张照片）的完整 API，可以在 Flutter 层构建自定义 UI 并实现全部选择模式。

### D2：页面结构 — 分层模型

```
PhotoPickerPage
├── AppBar：影集切换入口 + 全选按钮 + 确认按钮（显示已选数量）
├── 日期分组 ListView（SliverList）
│   ├── 日期标题行（含该日「全选」按钮）
│   └── 照片网格行（GridView，3列）
└── 底部确认栏（固定，显示「确认 N 张」）
```

状态使用 `StatefulWidget` + `setState` 管理，选中集合用 `Set<String>` 存储 AssetEntity id，保证 O(1) 查询。

### D3：回传协议

Bridge 回调约定：
```js
window.UploadBridge_callback(JSON.stringify([
  { id: "asset_id", uri: "content://..." },
  ...
]))
```
Web 端通过 `uri` 字段获取文件路径用于上传。Flutter 侧调用 `WebViewController.runJavaScript` 注入。

### D4：权限请求时机

在 `PhotoPickerPage.initState` 时调用 `photo_manager` 权限 API，若未授权则弹出系统权限请求。拒绝后 `pop` 回 WebView，不做强制引导（与系统行为一致）。

## Risks / Trade-offs

- **Android 分区存储差异**：Android 10+ 需要 `READ_MEDIA_IMAGES`，旧版需要 `READ_EXTERNAL_STORAGE`。`photo_manager` 的 Android 配置需要在 `build.gradle` 中额外设置 `requestLegacyExternalStorage`。→ 按官方文档配置，`minSdkVersion` 已为 21，兼容性可控。
- **大量照片性能**：照片库超大（5000+ 张）时首次加载可能有卡顿。→ 使用 `photo_manager` 的分页 API（`AssetPathEntity.getAssetListPaged`）懒加载，每页 80 张。
- **iOS 受限权限（limited access）**：iOS 14+ 用户可只授权部分照片。→ 展示实际可访问的照片即可，不强制要求完整权限。

## Migration Plan

1. `pubspec.yaml` 添加 `photo_manager: ^3.x`，运行 `flutter pub get`
2. 配置 Android/iOS 权限声明
3. 新建 `lib/pages/photo_picker_page.dart`
4. 修改 `lib/pages/webview_page.dart` 替换 `_showBridgeDialog`

## Open Questions

- Web 端期望的回调函数名是否固定为 `UploadBridge_callback`？（当前设计假设是，如需动态传入需调整 Bridge 消息协议）
