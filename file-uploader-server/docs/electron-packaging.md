# Electron 桌面应用打包路线图

> **状态**：纲领文档（roadmap），不参与 OpenSpec 状态机。
> 实施被拆分为多个独立的 change 提案，本文档作为跨提案、跨仓库的全局视角。

## 目标

把 `file-uploader-server` (NestJS) 与 `file-uploader-fe` (Vue 3) 打包为单个 Electron 桌面应用，先在 macOS 跑通，后续重点支持 Windows。改造完成后：

- 桌面端：双击安装、单机使用、数据放 `app.getPath('userData')`
- 服务端独立部署（局域网 NAS / 内网）：行为与改造前完全一致，零回归

## 范围

| 仓库 | 改动概要 |
|---|---|
| `file-uploader-server`（本仓库） | 接入环境变量驱动的运行时数据路径、新增健康检查接口、删除未使用的鉴权与用户模块 |
| `file-uploader-fe`（独立仓库） | 删除登录页与 token 拦截器；打包桌面端时通过 `VITE_API_BASE_URL` 注入 baseURL |
| `file-uploader-desktop`（待新建） | Electron 主进程 fork NestJS 子进程、首次启动跑 prisma migrate deploy、加载前端 dist、electron-builder 产出 dmg/nsis |

## 关键决策（决策记录）

### D1: Electron 与 NestJS 走 fork 子进程，不内嵌
NestJS 异常不会拖垮 UI；fork 子进程可独立观察日志；多花 1-3s 启动延迟用 loading 页 + `/health` 轮询缓解。

### D2: Desktop 工程独立装一份生产依赖
Desktop `package.json` 抄写 server `dependencies`，配 `check-deps-sync.js` 防漂移。比整拷 `server/node_modules` 更利于跨平台 native rebuild。

### D3: SQLite 与上传目录都放 `app.getPath('userData')`
mac: `~/Library/Application Support/FileUploader/`；win: `%APPDATA%/FileUploader/`。app 包只读，必须外移。

### D4: 前端 baseURL 在 build 期写死
Desktop 触发前端 build 时设 `VITE_API_BASE_URL=http://127.0.0.1:38902/`；前端 `apiBase.ts` 已优先读该 env，零侵入。独立部署不设该 env，回退到 `window.location.hostname` 行为。

### D5: 端口冲突在 v1 不解决
启动失败展示错误页让用户处理；v2 引入端口探测 + preload 注入再做动态端口。

### D6: Prisma engine 通过 `asarUnpack` 释放
`.node` 二进制无法在 asar 内被 require（mmap 失败），通过 `asarUnpack` 释放到 `app.asar.unpacked/`。

### D7: 删除 auth + users 模块
桌面端单机不需要鉴权；users 模块所有方法返回 null，无写入路径。**独立部署仅限局域网/可信网络**。

### D8: 数据库现场迁移
首次启动检测 `${userData}/data.db` 不存在 → 跑 `prisma migrate deploy` 现场建表，不预生成模板 db（migration 是真理之源）。

### D9: Prisma 多平台 binaryTargets
`binaryTargets = ["native", "darwin", "darwin-arm64", "windows"]` 一次性产出三平台 engine，跨平台打包通过环境变量切换。

### D10: 鉴权策略与部署边界
本服务**不实施鉴权**。桌面单机由 OS 用户隔离；局域网部署由网络边界保护；不应直接暴露公网。需要鉴权时在上游加反向代理（nginx basic-auth、Cloudflare Access 等）。

## 实施路线图（5 阶段）

### P1：Server 改造（本仓库）

拆为 3 个独立 OpenSpec change，可并行 apply，建议按以下顺序：

| # | Change | 作用 | 状态 |
|---|---|---|---|
| 1 | `server-runtime-paths` | `DATA_DIR` + `DATABASE_URL` + `binaryTargets` + `runtime-paths` 模块 + 改造 FilesService/main.ts | ✅ 已完成 |
| 2 | `server-health-check` | 新增 `GET /health` 接口 + HealthModule | ✅ 已完成 |
| 3 | `server-remove-auth-users` | 删除 auth + users 模块、JWT 依赖、AuthGuard 装饰器；新增 `auth-policy` 能力声明部署边界 | ✅ 已完成 |

**验证标准**：每个 change archive 时 `npm run start:dev` 与现有上传/下载流程必须仍然工作。

### P2：前端改造（独立仓库 file-uploader-fe）

在前端仓库另起 OpenSpec change（不在本仓库追踪）：
- 删除登录页、登录路由、axios 拦截器中的 token 注入与 401 重定向
- 验证 build 时 `VITE_API_BASE_URL=http://127.0.0.1:38902/` 注入产物可访问后端
- 验证 `npm run dev` + 独立 server 仍正常工作

### P3：Desktop 工程骨架（待新建仓库 file-uploader-desktop）

待 P1 完成后启动。在 desktop 仓库另起 OpenSpec change：
- `package.json` 含 electron + electron-builder + server prod deps
- `electron/main.js`：BrowserWindow + 加载 loading.html
- `electron/preload.js`：占位
- `scripts/check-deps-sync.js`：与 server `dependencies` 段对比

### P4：主进程 fork server + 端到端联调

Desktop 仓库的 change：
- 检测 `${userData}/data.db` 不存在时跑 `prisma migrate deploy`
- `child_process.fork('resources/server/dist/main.js')` + 注入 env
- 轮询 `/health` 200 后 `loadFile('resources/web/index.html')`
- 子进程 stdout/stderr 重定向到 `${userData}/logs/server.log`
- `before-quit` 钩子 kill 子进程
- `scripts/prepare-resources.js` 触发 server + 前端 build 并拷贝产物

### P5：electron-builder 打 mac dmg

Desktop 仓库的 change：
- `electron-builder.yml`：mac dmg、`identity: null`、`asarUnpack` 释放 Prisma
- `npm run dist:mac` 产出 `FileUploader-*.dmg`
- 安装后端到端验证：上传/下载/列表/删除全部可用
- `${userData}/` 下能看到 `data.db`、`static/`、`logs/`

### P6（后续）：Windows 打包

Mac 跑通后再启动；可能需要 GitHub Actions matrix 或本地 Win 机器。

## 跨仓库依赖关系

```
[P1: server-runtime-paths]   [P1: server-health-check]   [P1: server-remove-auth-users]
              \                       |                              /
               \______________________|_____________________________/
                                      |
                                      ▼
                          [P2: 前端改造（fe-pc 仓库）]
                                      |
                                      ▼
                         [P3-P5: Desktop 工程（desktop 仓库）]
                                      |
                                      ▼
                              [P6: Windows 打包]
```

P1 三个 change 互相独立可并行；P2 不强依赖 P1（独立 server 仍可工作），但 desktop 工程依赖 P1.runtime-paths + P1.health-check 完成。

## 已知风险与缓解

| 风险 | 缓解 |
|---|---|
| Prisma engine 在 Electron asar 内加载失败 | `asarUnpack` 释放；备选 `asar: false` |
| fork NestJS 启动期间 BrowserWindow 空白 | 先 loadFile loading.html，`/health` 200 后再切换 |
| 端口 38902 被占用 | v1 启动失败展示错误页；v2 引入动态端口 |
| desktop 与 server 依赖版本漂移 | `check-deps-sync.js` 在 prebuild 阶段执行 |
| mac 不签名 Gatekeeper 拦截 | 自用接受"右键打开"绕过；分发场景留到引入 Apple Developer 账号 |
| 首次启动 prisma migrate deploy 失败 | 捕获子进程退出码展示错误页 + 日志路径 |
| 前端仓库未同步删除登录页导致桌面端白屏 | 桌面端 P5 验证步骤包含完整端到端，不通过则阻塞发布 |

## 部署边界声明

本服务删除 auth/users 后**不实施任何鉴权**。允许的部署场景：

- ✅ 桌面 Electron 应用（单机使用，OS 用户隔离）
- ✅ 家庭 / 办公室局域网（NAS、内网 Docker、可信网络）
- ❌ **不应直接暴露公网**
- ❌ 不应部署在不可信的多用户网络（咖啡店 WiFi、共享办公等）

若未来需要公网部署，应在上游网关层（nginx basic-auth、Cloudflare Access、Tailscale 等）加鉴权，不在 server 内部实施。
