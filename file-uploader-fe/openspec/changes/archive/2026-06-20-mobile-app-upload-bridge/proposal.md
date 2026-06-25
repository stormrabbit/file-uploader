## Why

Flutter App 通过 `webview_flutter` 加载移动端 Web 页面。Web 页面中的 `van-uploader`（底层是 `<input type="file">`）在 App WebView 环境下点击无响应——这是 Android WebView 的已知限制：`<input type="file">` 的文件选择器需要 Activity 级别的回调支持，`webview_flutter` 默认不处理，导致点击被静默拦截。

在纯浏览器环境（手机浏览器直接访问）下，`van-uploader` 工作正常，不需要任何修改。

## What Changes

- **Web 端**：检测当前运行环境（WebView App vs 浏览器），在 App 环境下替换上传触发方式——不使用 `<input type="file">`，改为通过 JavaScript Bridge 通知 Flutter 侧发起原生图片选择器
- **Flutter App 端**：在 `WebViewPage` 中注册 JavaScript Channel（`UploadBridge`），监听 Web 端消息，调用原生图片选择后通过 `evaluateJavascript` 将结果回传

## Capabilities

### New Capabilities

- `mobile-app-upload-bridge`：Web/App 双环境上传适配，浏览器走原有 `van-uploader`，App 内走 Flutter JavaScript Bridge + 原生图片选择器

### Modified Capabilities

（无现有 spec 文件）

## Impact

- `src/pages/mobile/modules/Dashboard.vue`：添加环境检测，App 环境下按钮改为调用 `window.UploadBridge.postMessage`
- `file-uploader-app/lib/pages/webview_page.dart`：注册 `JavascriptChannel`，处理图片选择并回传
