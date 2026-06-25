### Requirement: Web 端检测 App 环境并切换上传入口
移动端 Dashboard SHALL 在运行时检测是否处于 Flutter App WebView 环境，在 App 环境下替换上传触发方式，在浏览器环境下保持原有 `van-uploader` 行为不变。

#### Scenario: 浏览器环境下行为不变
- **WHEN** 用户在手机浏览器中访问移动端页面
- **THEN** 页面展示原有 `van-uploader` 组件，点击正常呼起系统文件选择器

#### Scenario: App 环境下展示 Bridge 按钮
- **WHEN** 用户在 Flutter App 的 WebView 中访问移动端页面
- **THEN** `van-uploader` 被替换为普通点击按钮，点击后通过 `window.UploadBridge.postMessage` 通知 Flutter 侧

#### Scenario: 环境检测方式
- **WHEN** 页面 `onMounted` 后
- **THEN** 通过检测 `typeof window.UploadBridge !== 'undefined'` 判断是否处于 App 环境

---

### Requirement: Flutter App 注册 JavaScript Channel 接收 Web 消息
Flutter 端 `WebViewPage` SHALL 注册名为 `UploadBridge` 的 JavascriptChannel，接收来自 Web 端的消息。

#### Scenario: 收到 pickImage 消息后弹出确认 Dialog（阶段一）
- **WHEN** Web 端发送 `{ "action": "pickImage" }` 消息
- **THEN** Flutter 弹出一个 Dialog，内容为「调用到了！Bridge 通信正常」，用于验证链路

#### Scenario: JavascriptChannel 名称固定为 UploadBridge
- **WHEN** Flutter WebView 初始化
- **THEN** `window.UploadBridge` 被注入到 WebView JS 全局上下文，Web 端可通过此对象调用 Flutter
