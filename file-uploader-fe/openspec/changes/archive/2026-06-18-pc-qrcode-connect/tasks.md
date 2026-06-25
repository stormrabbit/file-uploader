## 1. 依赖安装

- [x] 1.1 安装 `qrcode` 及其类型声明：`npm install qrcode` + `npm install -D @types/qrcode`

## 2. 后端接口（后端侧）

- [ ] 2.1 新增 `GET /api/server-info` 接口，返回 `{ lan_ip: string }`；服务端枚举本机网络接口，取非 loopback 的首个 IPv4 地址（**后端侧实现**）

## 3. 前端 API 层

- [x] 3.1 在 `src/api/index.ts` 中新增 `getServerInfo(): Promise<{ lan_ip: string }>` 方法，调用 `GET /api/server-info`

## 4. QrcodeConnectDialog 组件

- [x] 4.1 新建 `src/pages/pc/modules/QrcodeConnectDialog.vue`，props：`modelValue: boolean`（`v-model:modelValue` 控制显隐）
- [x] 4.2 组件内 `watch(modelValue)` 在打开时调用 `getServerInfo()`，将 `http://<lan_ip>:<VITE_API_BASE_BACKEND_PORT>/mobile` 传入 `QRCode.toDataURL()` 生成 base64
- [x] 4.3 生成成功时展示 `<img :src="qrcodeDataUrl">`，配合提示文案「用手机扫描二维码，打开上传页面」
- [x] 4.4 生成失败时展示错误提示「获取局域网地址失败，请检查服务是否运行」
- [x] 4.5 关闭弹层时重置 `qrcodeDataUrl` 和错误状态

## 5. Dashboard 接入

- [x] 5.1 在 `src/pages/pc/modules/Dashboard.vue` 中引入 `QrcodeConnectDialog` 组件
- [x] 5.2 工具栏新增「连接」按钮（`el-button`），点击时将 `dialogVisible` 设为 `true`
- [x] 5.3 在模板中挂载 `<QrcodeConnectDialog v-model="dialogVisible" />`

## 6. 验证

- [ ] 6.1 通过 `localhost` 访问 PC 端，点击「连接」，确认弹层内二维码 URL 中的 IP 为服务器局域网 IP（非 localhost）
- [ ] 6.2 用手机扫描二维码，确认能正常访问 Mobile 上传页
- [ ] 6.3 模拟接口失败（断开后端），确认弹层内显示错误提示
