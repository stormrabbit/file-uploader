## 1. 依赖与权限配置

- [x] 1.1 在 `pubspec.yaml` 添加依赖：`mobile_scanner`、`webview_flutter`
- [x] 1.2 在 `android/app/build.gradle` 确认 `minSdkVersion` ≥ 21
- [x] 1.3 在 `android/app/src/main/AndroidManifest.xml` 添加 `CAMERA` 权限
- [x] 1.4 在 `ios/Runner/Info.plist` 添加 `NSCameraUsageDescription`

## 2. 项目结构初始化

- [x] 2.1 改造 `lib/main.dart`：替换默认计数器，设置 MaterialApp（M3 主题）和初始路由指向 `HomePage`
- [x] 2.2 新建 `lib/pages/home_page.dart` 文件（空文件占位）
- [x] 2.3 新建 `lib/pages/webview_page.dart` 文件（空文件占位）

## 3. 主页二维码扫描器实现

- [x] 3.1 在 `HomePage` 实现摄像头取景框（使用 `MobileScanner` widget，全屏或大面积布局）
- [x] 3.2 实现权限状态检测：权限已授予显示扫描器，未授予显示引导文案 + 授权按钮
- [x] 3.3 实现扫码回调：检测到 HTTP/HTTPS URL 时调用 `Navigator.push` 跳转 `WebViewPage`
- [x] 3.4 实现非 URL 内容的处理：继续扫描，可选 SnackBar 短暂提示"非有效地址"
- [x] 3.5 返回主页时重新激活摄像头（利用 `MobileScanner` 的 `start/stop` 生命周期）

## 4. WebView 页面实现

- [x] 4.1 在 `WebViewPage` 接收路由参数 `url`，初始化 `WebViewController` 并加载该 URL
- [x] 4.2 配置 WebView 启用 JavaScript
- [x] 4.3 实现 AppBar 含标题（如"文件上传"）和返回按钮（`Navigator.pop`）

## 5. UI 细节与 Material Design 3 完善

- [x] 5.1 主页 AppBar 设置标题"扫码连接"，使用 M3 ColorScheme
- [x] 5.2 扫描取景框添加四角边框装饰覆盖层（提升识别区域视觉引导）
- [x] 5.3 在取景框下方添加提示文案"对准 PC 端二维码扫描"

## 6. 验证

- [ ] 6.1 在 Android 模拟器/真机上运行，验证摄像头权限请求流程
- [ ] 6.2 用 PC 端页面生成的二维码测试扫码跳转，确认 WebView 正常加载页面
- [ ] 6.3 验证从 WebView 返回后摄像头重新激活
