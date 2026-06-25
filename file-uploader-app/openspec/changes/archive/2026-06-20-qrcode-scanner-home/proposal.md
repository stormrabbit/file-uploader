## Why

手机端用户需要通过扫描 PC 上展示的二维码来连接局域网文件上传服务，但目前没有原生 App 可用，用户只能依赖系统相机扫码后跳转浏览器，体验割裂。本功能为 App 提供一个清晰的主入口：扫码即连，一步进入上传页面。

## What Changes

- 新增 App 主页（`HomePage`），采用 Material Design 3 风格
- 主页内嵌实时摄像头取景框，作为二维码扫描器
- 扫描到有效 URL 后，在 App 内置 WebView 中打开对应页面
- 添加必要的 Android/iOS 权限（摄像头）

## Capabilities

### New Capabilities

- `qrcode-scanner`: 主页二维码扫描能力 —— 实时识别摄像头画面中的 QR Code，提取 URL
- `inapp-webview`: 扫码成功后在 App 内打开局域网 URL，展示前端上传页面

### Modified Capabilities

（无）

## Impact

- **依赖新增**: `mobile_scanner`（二维码扫描）、`webview_flutter`（内置浏览器）
- **权限**: Android `CAMERA`，iOS `NSCameraUsageDescription`
- **代码**: `lib/main.dart` 改造为路由入口，新增 `lib/pages/home_page.dart`、`lib/pages/webview_page.dart`
- **不影响**: 后端服务、前端 PC/Mobile 页面均无需改动
