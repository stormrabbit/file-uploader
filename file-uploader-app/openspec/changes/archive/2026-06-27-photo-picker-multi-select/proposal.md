## Why

Bridge 通信链路已验证可用（`UploadBridge.pickImage` 调用成功）。当前仅弹出确认 Dialog，尚未实现真正的照片选择逻辑。用户需要在 App 内选择手机相册中的照片，通过 Bridge 将所选文件信息回传给 PC 端 WebView，完成文件上传前的选片环节。

## What Changes

- 将 `_showBridgeDialog()` 替换为原生相册选择器页面
- 新增 `PhotoPickerPage`：以网格形式展示手机相册中的全部照片
- 支持以下选择模式：
  - 逐张勾选（单张选择）
  - 按日期（拍摄日期）全选当天照片
  - 按影集（相册分组）全选某个影集的全部照片
  - 一键全选相册内所有照片
- 选择完成后通过 `WebViewController.runJavaScript` 将已选文件路径/URI 列表回传给 Web 端
- Web 端接收到数据后自行发起上传请求

## Capabilities

### New Capabilities

- `photo-picker`: 原生相册多选页面，支持逐张选择、按日期全选、按影集全选、一键全选

### Modified Capabilities

- `inapp-webview`: Bridge 响应逻辑从弹 Dialog 改为跳转相册选择器，并在选完后回传数据给 Web 端

## Impact

- **新增依赖**：`photo_manager`（访问系统相册）；现有 `webview_flutter` 保持不变
- **修改文件**：`lib/pages/webview_page.dart`（替换 `_showBridgeDialog`，增加回调逻辑）
- **新增文件**：`lib/pages/photo_picker_page.dart`
- **Android 权限**：需添加 `READ_MEDIA_IMAGES`（Android 13+）/ `READ_EXTERNAL_STORAGE`（Android < 13）
- **iOS 权限**：需在 `Info.plist` 添加 `NSPhotoLibraryUsageDescription`
