## MODIFIED Requirements

### Requirement: Bridge 响应 pickImage 消息
WebViewPage SHALL 监听 `UploadBridge` 频道的 `pickImage` 消息；收到后跳转到 PhotoPickerPage，待用户完成选择后将结果通过 JavaScript 注入回传给 Web 端。

#### Scenario: 收到 pickImage 消息
- **WHEN** Web 端通过 `UploadBridge.postMessage(JSON.stringify({action:'pickImage'}))` 发送消息
- **THEN** App SHALL 跳转到 PhotoPickerPage

#### Scenario: 用户完成选择后回传
- **WHEN** 用户在 PhotoPickerPage 确认选择
- **THEN** WebViewPage SHALL 执行 `window.UploadBridge_callback(jsonArray)` 将选中照片的本地 URI 列表注入 WebView

#### Scenario: 用户取消选择
- **WHEN** 用户在 PhotoPickerPage 点击返回/取消
- **THEN** WebViewPage SHALL 不执行任何回调，Web 端维持原状
