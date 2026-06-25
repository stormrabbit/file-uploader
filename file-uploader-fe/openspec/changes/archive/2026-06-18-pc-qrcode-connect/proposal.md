## Why

手机端用户（老人）需要手动输入局域网地址才能访问上传页，容易出错。PC 端提供一个「连接」按钮，点击生成包含当前局域网 IP + 端口的二维码，手机扫码即可直达上传页，零输入门槛。

## What Changes

- PC 端 Dashboard 工具栏新增「连接」按钮
- 点击按钮时调用后端接口获取服务器局域网 IP
- 将 IP + `VITE_API_BASE_BACKEND_PORT` 拼接为 Mobile 上传页 URL，生成二维码
- 二维码展示在 `el-dialog` 弹层中，配合提示文案引导手机扫码
- 功能封装为独立组件 `QrcodeConnectDialog.vue`

## Capabilities

### New Capabilities
- `pc-qrcode-connect`: PC 端扫码连接功能——展示局域网二维码，供手机扫码直达上传页

### Modified Capabilities
- `pc-file-gallery`: Dashboard 工具栏新增「连接」按钮入口

## Impact

- **新增文件**：`src/pages/pc/modules/QrcodeConnectDialog.vue`
- **修改文件**：`src/pages/pc/modules/Dashboard.vue`（引入并使用新组件）
- **新增 API**：后端需提供获取服务器局域网 IP 的接口（如 `GET /api/server-info`）
- **新增依赖**：qrcode 生成库（如 `qrcode` 或 `vue-qrcode`）
