## 1. 前端工具函数

- [x] 1.1 新建 `src/utils/apiBase.ts`（同步版，使用 `window.location.hostname`）
- [x] 1.2 在 `.env` 中新增 `VITE_API_BASE_BACKEND_PORT=38902`，注释 `VITE_API_BASE_URL` 说明其为可选覆盖项

## 2. app 启动接入

- [x] 2.1 修改 `src/pages/pc/main.ts`：同步调用 `initApiBaseUrl()`
- [x] 2.2 修改 `src/pages/mobile/main.ts`：同上

## 3. API 层替换

- [x] 3.1 修改 `src/api/index.ts`：删除构造函数中的 `baseURL` 参数传入，在 axios 请求拦截器中设置 `config.baseURL = getApiBaseUrl()`
- [x] 3.2 修改 `src/pages/pc/modules/FileGrid.vue`

## 4. 验证

- [ ] 4.1 通过 `localhost` 访问 PC 端，确认 Network 面板中 API 请求和图片 URL 指向真实 LAN IP:38902（非 localhost）
- [ ] 4.2 通过局域网 IP 访问 Mobile 端，确认上传请求指向正确的 LAN IP:38902
