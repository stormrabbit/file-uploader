## Context

前端通过 `import.meta.env.VITE_API_BASE_URL` 取得 API 地址，该值在构建时写入 bundle。局域网环境下本机 IP 随网络变化，每次变化都要改 `.env` 并重新构建。

`window.location.hostname` 在此场景下是可靠的：
- PC 通过 `http://localhost:38903/pc` 访问 → hostname = `localhost` → `localhost:38902` 在同一台机器上可达
- 移动端通过 `http://192.168.x.x:38903/mobile` 访问 → hostname = `192.168.x.x` → `192.168.x.x:38902` 可达

曾考虑通过 `http://localhost:{PORT}/files/ip` 请求后端获取真实 LAN IP，但该方案在移动端不可行——移动端浏览器执行 `localhost` 指向的是手机自身而非服务器。

## Goals / Non-Goals

**Goals:**
- 运行时动态获取 base URL，无需重新构建
- 端口通过 `VITE_API_BASE_BACKEND_PORT` 构建时可配（默认 `38902`）
- 所有 API 调用和资源 URL 统一使用同一套动态 base URL

**Non-Goals:**
- 不支持多后端 / 多端口配置
- 不处理 HTTPS 场景（局域网工具，HTTP 足够）
- 不做后端接口请求，纯前端解决

## Decisions

### 1. 使用 `window.location.hostname` 构造 base URL

**选择**：`initApiBaseUrl()` = `http://${window.location.hostname}:${VITE_API_BASE_BACKEND_PORT}/`

**理由**：用户访问前端所用的 hostname 与后端在同一台机器上，端口不同但 host 相同。PC 用 localhost 访问，localhost:38902 可达；移动端用 LAN IP 访问，LAN IP:38902 可达。无需任何网络请求，同步完成。

**放弃方案**：`http://localhost:{PORT}/files/ip` → 移动端 localhost 指向手机自身，请求永远失败。

### 2. `initApiBaseUrl()` 同步执行，无需 async

**选择**：`initApiBaseUrl()` 为同步函数，直接赋值模块级变量。

**理由**：不再需要网络请求，逻辑退化为纯字符串拼接，无需 async/await。`main.ts` 无需 top-level await。

### 3. ApiService 用请求拦截器动态读取 base URL

**选择**：在 axios 请求拦截器中设置 `config.baseURL = getApiBaseUrl()`。

**理由**：`api/index.ts` 在模块加载时执行，`initApiBaseUrl()` 虽为同步但需在 main.ts 中显式调用后才有值。拦截器确保每次请求时读取已初始化的值。

### 4. `VITE_API_BASE_URL` 降级为覆盖入口

**选择**：`initApiBaseUrl()` 优先检查 `import.meta.env.VITE_API_BASE_URL`，有值则直接用。

**理由**：保留开发者指向特定测试服务器的能力。

## Risks / Trade-offs

- **通过域名访问**：若通过自定义域名（如 `m.file-uploader.com`）访问，hostname 为域名而非 IP，需确保该域名在 38902 端口可达，否则需用 `VITE_API_BASE_URL` 覆盖。当前局域网直连场景不受影响。

## Migration Plan

1. 前端新增 `src/utils/apiBase.ts`（同步版本）
2. PC / Mobile 各自 `main.ts` 在 `mount()` 前调用 `initApiBaseUrl()`（同步，无需 await）
3. `api/index.ts` 移除 baseURL 参数，`services/axios.ts` 改用拦截器注入
4. `FileGrid.vue` 替换图片 URL 拼接
5. `.env` 补充 `VITE_API_BASE_BACKEND_PORT=38902`
6. 后端无需改动
