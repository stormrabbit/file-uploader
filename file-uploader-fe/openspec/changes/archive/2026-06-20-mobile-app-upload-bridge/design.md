## Context

Flutter `webview_flutter` 在 Android 上默认不处理 `<input type="file">` 的 `chooser` Intent，导致点击无响应。解决方案是绕过 `<input type="file">`，改用 Flutter JavaScript Channel 作为 Bridge，由 Flutter 侧调用原生图片选择器，选完后通过 `evaluateJavascript` 将文件数据（Base64 或文件路径）传回 Web。

## Goals / Non-Goals

**Goals:**
- App 内点击上传按钮能正常呼起原生图片选择器
- 浏览器直接访问时行为不变，仍走 `van-uploader`
- 阶段一：先验证通信链路（弹窗确认调用成功）
- 阶段二：真正传图（Base64 回传 → 转 File 对象 → 走现有上传队列）

**Non-Goals:**
- 不修改后端接口
- 不支持 iOS（当前 App 仅 Android）
- 阶段一暂不实现真正传图，只验证 Bridge 通信

## Decisions

### 决策1：环境检测方式

**选择**：检测 `window.UploadBridge` 是否存在

**理由**：
- Flutter 端注册 JavascriptChannel 后，`window.UploadBridge` 会被注入到 WebView 的 JS 全局上下文
- 浏览器环境不存在此对象，可以作为可靠的环境判断依据
- 比 User-Agent 检测更精确，不依赖字符串匹配

**实现**：
```js
const isInApp = () => typeof window.UploadBridge !== 'undefined'
```

---

### 决策2：Bridge 通信协议

**选择**：Web → Flutter 发送 JSON 消息，Flutter 处理后通过 `evaluateJavascript` 回调

**消息格式（Web → Flutter）**：
```json
{ "action": "pickImage" }
```

**回调格式（Flutter → Web，阶段二）**：
```js
window.onAppImageSelected([{ name: "xxx.jpg", base64: "..." }])
```

**理由**：JSON 消息便于后续扩展更多 action 类型

---

### 决策3：阶段一只验证通信，弹窗提示

**选择**：阶段一中，Flutter 收到 `pickImage` 消息后只弹一个 Flutter Dialog 提示"调用到了"，不实际选图

**理由**：
- 先验证 Bridge 通信链路是否打通
- 原生图片选择器涉及权限申请，阶段一排除干扰
- 提案完成后再推进阶段二（实际选图 + Base64 回传）

---

### 决策4：Web 端降级处理

**选择**：App 环境下隐藏 `van-uploader`，渲染一个普通 `div` 按钮，点击时调用 Bridge

**理由**：
- `van-uploader` 在 App WebView 中即使不触发选图，点击也可能产生副作用
- 用 `v-if` / `v-else` 完全分离两套 DOM，逻辑清晰

## Risks / Trade-offs

- **`window.UploadBridge` 注入时机**：WebView 页面加载完成前 JS Channel 可能未注入，需在 `onMounted` 后检测而非顶层立即执行
- **阶段二 Base64 大图性能**：大量大图用 Base64 传输内存压力大，可改用 Flutter 直接 POST 文件（绕过 Web），但阶段二再评估

## Migration Plan

1. Web 端添加环境检测 + App 模式按钮（调用 `window.UploadBridge.postMessage`）
2. Flutter 端 `WebViewPage` 注册 `JavascriptChannel('UploadBridge', ...)`，收到消息后弹 Dialog
3. 联调验证：App 内点击按钮 → Flutter Dialog 出现 ✅
4. 阶段二：Flutter 调用原生选图 → Base64 回传 → Web 端转 File → 走现有 `useUploadQueue`

## Open Questions

- 阶段二图片回传用 Base64 还是让 Flutter 直接 HTTP 上传？（待阶段一完成后决策）
