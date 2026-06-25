## ADDED Requirements

### Requirement: WebView 内置浏览器展示网页
App SHALL 提供内置 WebView 页面，用于加载并展示局域网 URL 指向的网页内容，无需跳转外部浏览器。

#### Scenario: 加载局域网地址
- **WHEN** WebView 页面收到一个局域网 HTTP URL（如 `http://192.168.x.x:port/mobile`）
- **THEN** WebView SHALL 加载并渲染该页面，包括 JavaScript 执行和表单交互

#### Scenario: 加载失败时的展示
- **WHEN** 目标 URL 不可访问（服务未启动或网络断开）
- **THEN** WebView SHALL 展示系统默认的网络错误页面，用户可通过 AppBar 返回重新扫码
