## Why

当前 WebView Bridge 回传的是本地文件路径，但 Web 端需要服务端 URL。若改为 base64 传输，多张照片会导致 Bridge 消息过大（数百 MB），极易造成内存崩溃。由 App 原生直接上传，既能规避 base64 问题，又能提供原生上传进度，体验更好。

## What Changes

- App 选完照片后，不再直接回传文件路径，而是在 Flutter 侧完成上传流程再回传结果
- 上传前计算文件 MD5，调用 `files/isExist` 接口实现秒传
- 调用 `files/upload` 接口以 multipart/form-data 上传文件
- 上传并发控制：最大活跃上传数为 1（串行队列）
- 上传失败时跳过当前文件，继续上传下一张
- 上传 host 使用扫码得到的 IP，端口固定为 38902（可配置）
- 显示原生上传进度 UI（每张照片的当前进度百分比）
- 全部完成后通过 `window.UploadBridge_callback` 回传上传结果 JSON 数组给 Web 端

## Capabilities

### New Capabilities

- `file-uploader`: App 原生文件上传能力，包含 MD5 计算、秒传判断、multipart 上传、并发队列控制、进度显示

### Modified Capabilities

- `inapp-webview`: Bridge `pickImage` 响应行为变更——从回传本地路径改为回传服务端上传结果（含 fileId/url）

## Impact

- 新增上传服务模块 `lib/services/upload_service.dart`
- 修改 `lib/pages/webview_page.dart` 的 `_openPhotoPicker` 方法，串联上传流程
- 新增上传进度展示页/弹层
- 配置项：上传端口 `38902`，需从扫码 IP 中提取 host
- 依赖：Dart 内置 `crypto`（MD5）、`http` 或 `dio`（multipart 上传）
