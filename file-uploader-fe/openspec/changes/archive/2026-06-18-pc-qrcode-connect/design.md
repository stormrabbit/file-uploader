## Context

PC 端用户（通常是家庭成员）需要让老人手机连接到局域网上传页，现有流程要求手动输入 IP 地址，容易出错。后端已能感知自身的局域网 IP（通过网络接口枚举），前端只需调一个接口拿到 IP，拼上已知端口和路径，生成二维码即可。

现有技术栈：Vue 3 + TypeScript + Element Plus，已有 `ApiService` 封装 axios，已有 `getApiBaseUrl()` 工具函数。

## Goals / Non-Goals

**Goals:**
- PC 端一键展示局域网二维码，手机扫码直达 Mobile 上传页
- 功能封装为独立组件，不污染 Dashboard 主逻辑
- 复用现有 ApiService，不绕过拦截器

**Non-Goals:**
- 不支持 HTTPS / 公网场景
- 不做二维码样式定制（颜色、Logo 等）
- 不做连接状态检测（扫码后是否成功访问）

## Decisions

### 1. 二维码生成库：`qrcode`（npm）

**选择**：使用 `qrcode` 包（`import QRCode from 'qrcode'`），调用 `QRCode.toDataURL(url)` 生成 base64 图片，用 `<img>` 标签展示。

**理由**：纯前端生成，无服务端依赖；`qrcode` 是社区最广泛使用的方案，bundle size 约 40KB（gzip 后约 15KB），在局域网工具场景可接受。

**备选**：`vue-qrcode`（基于 `qrcode` 的 Vue 组件封装）—— 额外封装层对本场景无收益，直接调 API 更轻。

### 2. 弹层方案：`el-dialog`

**选择**：使用 Element Plus 的 `el-dialog`，通过 `v-model` 控制显隐。

**理由**：与项目已有 UI 框架一致，无需引入额外依赖；Dialog 比 Popover/Dropdown 更适合展示二维码这种需要较大空间的内容。

### 3. 后端接口：`GET /api/server-info`

**选择**：新增后端接口返回 `{ lan_ip: string }`，前端拼接为 `http://<lan_ip>:<VITE_API_BASE_BACKEND_PORT>/mobile`。

**理由**：前端无法可靠地从 `window.location.hostname` 推断服务器 LAN IP（PC 可能通过 localhost 访问，但手机需要真实 IP）。由服务端返回是唯一可靠的方式。

**备选**：前端直接用 `getApiBaseUrl()` 中的 hostname —— 当 PC 通过 `localhost` 访问时，生成的二维码 URL 对手机无效。

### 4. 组件设计：单文件组件，props 驱动

`QrcodeConnectDialog.vue` 通过 `v-model:visible` 控制显隐，内部自行调用接口，父组件（Dashboard）只需绑定一个布尔值。二维码 URL 在 dialog 打开时（`watch(visible)`）异步生成。

## Risks / Trade-offs

- **服务器多网卡**：服务端返回的 LAN IP 可能有多个（Wi-Fi + 有线），需后端约定返回首选 IP（与前端所在同一子网的那个）。 → 后端实现时需处理，前端无需感知。
- **bundle size**：引入 `qrcode` 约增加 40KB（未 gzip）。→ 局域网场景下可接受，后续可按需懒加载。
- **接口不存在时的 UX**：若后端未实现接口，Dialog 内显示错误提示，不影响其他功能。
