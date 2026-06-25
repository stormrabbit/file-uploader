## Why

`.env` 中硬编码了 `VITE_API_BASE_URL=http://192.168.x.71:38902/`，每次本机 IP 变化（换路由器、切网络）都需要手动修改并重新构建，在局域网场景下频繁发生。`window.location.hostname` 在经由 `localhost` 或 `127.0.0.1` 访问时无法得到真实 LAN IP。后端已有 `GET /files/ip` 接口可返回服务器局域网 IP 列表，前端可利用此接口在运行时动态获取。

## What Changes

- 新增 `src/utils/apiBase.ts`：导出 `initApiBaseUrl()`（同步初始化，从 `window.location.hostname` + `VITE_API_BASE_BACKEND_PORT` 构造 base URL）和 `getApiBaseUrl()`（同步读取已缓存的 base URL）
- 新增 `.env` 变量 `VITE_API_BASE_BACKEND_PORT=38902`，端口构建时可配
- `src/pages/pc/main.ts` 和 `src/pages/mobile/main.ts` 在挂载 Vue 应用前调用 `initApiBaseUrl()`
- `src/api/index.ts` 的 ApiService 通过 axios 请求拦截器动态读取 `getApiBaseUrl()`，替代模块加载时写死的 baseURL
- `src/pages/pc/modules/FileGrid.vue` 中拼接图片 URL 替换为 `getApiBaseUrl()`
- `.env` 中的 `VITE_API_BASE_URL` 降级为可选覆盖（有值时跳过 hostname 逻辑）

## Capabilities

### New Capabilities

- `dynamic-api-base-url`: 运行时从 `window.location.hostname` 动态获取服务器 IP，结合 `VITE_API_BASE_BACKEND_PORT` 构造 base URL，替代构建时写死的环境变量

### Modified Capabilities

<!-- 无现有 spec 需要变更 -->

## Impact

- **后端**：无需改动
- **`src/utils/apiBase.ts`**：新增文件
- **`src/pages/pc/main.ts` / `src/pages/mobile/main.ts`**：启动时调用 `initApiBaseUrl()`
- **`src/api/index.ts`**：改为拦截器动态读取 base URL
- **`src/pages/pc/modules/FileGrid.vue`**：替换图片 URL 拼接
- **`.env`**：新增 `VITE_API_BASE_BACKEND_PORT=38902`；`VITE_API_BASE_URL` 变为可选覆盖
