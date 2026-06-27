## MODIFIED Requirements

### Requirement: Bridge pickImage 响应
当 WebView 发送 `{ action: 'pickImage' }` 消息时，系统 SHALL 跳转相册选择器，用户确认后执行原生上传流程，全部完成后通过 `window.UploadBridge_callback(jsonString)` 回传上传结果数组（每项 `{ id, fileId, url }`）给 Web 端。失败的文件不包含在回传结果中。

#### Scenario: 选择并上传成功
- **WHEN** 用户在相册选择器中选择照片并点击"确认"
- **THEN** 系统关闭选择器，展示上传进度 BottomSheet，完成后回传 `[{ id, fileId, url }, ...]`

#### Scenario: 用户取消选择
- **WHEN** 用户在相册选择器中点击"取消"或返回
- **THEN** 系统不触发上传，不调用 Bridge 回调，WebView 状态不变

#### Scenario: 全部上传失败
- **WHEN** 所有选中照片均上传失败
- **THEN** 系统回传空数组 `[]` 或不调用回调（具体由 Web 端协议确定）
