## Purpose

前端在运行时从当前页面的 `hostname` 动态构造 API Base URL，消除对硬编码环境变量的依赖，确保通过任意局域网 IP 或 localhost 访问时 API 请求均能正确路由。

## Requirements

### Requirement: 前端同步初始化 API Base URL
系统 SHALL 提供 `initApiBaseUrl()` 同步函数，从 `window.location.hostname` + `VITE_API_BASE_BACKEND_PORT` 构造 base URL 并缓存。当 `VITE_API_BASE_URL` 有值时直接使用，跳过 hostname 逻辑。

#### Scenario: 正常初始化，无覆盖变量
- **WHEN** `import.meta.env.VITE_API_BASE_URL` 未设置，页面通过 `http://192.168.x.x:38903/` 访问
- **THEN** `getApiBaseUrl()` 返回 `http://192.168.x.x:${VITE_API_BASE_BACKEND_PORT}/`

#### Scenario: PC 通过 localhost 访问
- **WHEN** `import.meta.env.VITE_API_BASE_URL` 未设置，页面通过 `http://localhost:38903/` 访问
- **THEN** `getApiBaseUrl()` 返回 `http://localhost:${VITE_API_BASE_BACKEND_PORT}/`

#### Scenario: 有覆盖变量时跳过 hostname 逻辑
- **WHEN** `import.meta.env.VITE_API_BASE_URL` 已设置为非空值
- **THEN** `initApiBaseUrl()` 直接使用该值，不读取 `window.location.hostname`

---

### Requirement: app 启动前完成初始化
PC 和 Mobile 各自的 `main.ts` SHALL 在 `app.mount()` 前调用 `initApiBaseUrl()`（同步），确保后续所有 API 调用时 base URL 已就绪。

#### Scenario: app 挂载前初始化完成
- **WHEN** Vue app 调用 `mount()` 时
- **THEN** `getApiBaseUrl()` 已返回非空的 base URL

---

### Requirement: API 请求动态使用 base URL
`src/api/index.ts` 中 ApiService 的 axios 实例 SHALL 通过请求拦截器在每次请求前读取 `getApiBaseUrl()`，而非在实例初始化时写死 baseURL。

#### Scenario: API 请求携带正确 base URL
- **WHEN** 任意 API 方法被调用（`get`/`post`/`patch`/`delete`）
- **THEN** 请求发往 `http://{hostname}:{VITE_API_BASE_BACKEND_PORT}/{path}`

---

### Requirement: 文件预览 URL 使用动态 base URL
`FileGrid.vue` 中拼接文件预览 URL 的逻辑 SHALL 调用 `getApiBaseUrl()` 替代 `import.meta.env.VITE_API_BASE_URL`。

#### Scenario: 文件预览 URL 正确拼接
- **WHEN** `FileGrid.vue` 需要构造文件资源 URL
- **THEN** URL 前缀来自 `getApiBaseUrl()`，指向与前端同 hostname 的 `VITE_API_BASE_BACKEND_PORT` 端口
