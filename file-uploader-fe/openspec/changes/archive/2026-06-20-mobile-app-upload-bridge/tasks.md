## 1. Web 端：环境检测 + App 模式按钮

- [x] 1.1 在 `src/pages/mobile/modules/Dashboard.vue` 中，`onMounted` 后检测 `typeof window.UploadBridge !== 'undefined'`，结果存入 `isInApp` ref
- [x] 1.2 将模板中的 `van-uploader` 包裹改为 `v-if="!isInApp"`，浏览器环境保持原样
- [x] 1.3 新增 `v-else` 分支：渲染一个样式与大按钮一致的 `div`，点击时调用 `window.UploadBridge.postMessage(JSON.stringify({ action: 'pickImage' }))`
- [x] 1.4 为 `window.UploadBridge` 补充 TypeScript 类型声明，避免编译报错（在 `env.d.ts` 或组件内 `declare` 扩展 `Window`）

## 2. Flutter 端：注册 JavascriptChannel

- [x] 2.1 在 `file-uploader-app/lib/pages/webview_page.dart` 的 `initState` 中，为 `WebViewController` 增加 `.addJavaScriptChannel('UploadBridge', onMessageReceived: _onBridgeMessage)`
- [x] 2.2 实现 `_onBridgeMessage` 方法：解析消息 JSON，当 `action == 'pickImage'` 时，弹出 Flutter `showDialog`，内容为「调用到了！Bridge 通信正常」
- [x] 2.3 确保 Dialog 有关闭按钮（`TextButton('确定', ...)`）

## 3. 联调验证

- [ ] 3.1 启动 Flutter App，扫码进入移动端页面，确认按钮样式正常渲染（非 `van-uploader`）
- [ ] 3.2 点击按钮，确认 Flutter Dialog 弹出，内容正确
- [ ] 3.3 在手机浏览器直接访问移动端页面，确认 `van-uploader` 正常工作，行为未受影响
