## Why

P3 阶段（desktop-scaffold）建立了最小 Electron 骨架，应用启动后只显示一个静态 loading 页，无法访问任何实际功能。P4 阶段需要把三个已改造完成的仓库（server、前端、desktop）串联起来：让 Electron 主进程在启动时 fork NestJS 子进程、等待服务就绪后切换到前端页面，从而实现"双击打开、上传文件"的完整桌面端体验。

## What Changes

- **新增 `scripts/prepare-resources.js`**：构建编排脚本，依次触发 server build（`npm run build`）和前端 build（注入 `VITE_API_BASE_URL=http://127.0.0.1:38902/`），然后将产物拷贝到本仓库的 `resources/server/` 与 `resources/web/`
- **`package.json` 更新**：`scripts.build` 从占位 echo 改为 `node scripts/prepare-resources.js`
- **`electron/main.js` 全面改造**（**BREAKING** — 完全替换 P3 的骨架版本）：
  - 首次启动时若 `${userData}/data.db` 不存在，先同步执行 `prisma migrate deploy` 建表
  - 通过 `child_process.fork` 启动 `resources/server/dist/main.js`，注入 `DATA_DIR`、`DATABASE_URL`、`PORT=38902`
  - 子进程 stdout/stderr 重定向写入 `${userData}/logs/server.log`
  - 轮询 `GET http://127.0.0.1:38902/health`，收到 200 后 `win.loadFile('resources/web/pages/pc/index.html')`
  - `before-quit` 钩子 kill 子进程，防止孤儿进程
  - 30s 超时或子进程异常退出时，渲染错误页（内嵌 HTML）并展示日志路径
- **新增 `electron/error.html`**：错误页模板，由主进程在异常时注入错误原因与日志路径

**不在本提案范围**：electron-builder 打包（P5）、asarUnpack（P5）、动态端口分配（v2）、Windows 支持（P6）

## Capabilities

### New Capabilities
- `resource-build`: 构建编排 —— 将 server 与前端的编译产物复制到 desktop `resources/` 目录，供主进程在运行时加载；build 时注入前端 API base URL
- `server-lifecycle`: Electron 主进程对 NestJS 子进程的完整生命周期管理 —— fork、env 注入、日志落盘、健康轮询、页面切换、优雅退出、异常处理

### Modified Capabilities
- `desktop-shell`: v1 只加载静态 loading 页；P4 后 loading 页成为启动过渡态，最终切换到前端页面 —— "不在 v1 阶段启动后端服务"这一 requirement 需要反转（移除该限制）

## Impact

- **修改文件**：`electron/main.js`（完全重写）、`package.json`（scripts.build）
- **新增文件**：`scripts/prepare-resources.js`、`electron/error.html`
- **新增目录**：`resources/server/`、`resources/web/`（构建产物，加入 .gitignore）
- **跨仓库依赖**：`prepare-resources.js` 需要同级的 `file-uploader-server` 和 `file-uploader-fe` 可访问且已安装依赖
- **运行时路径**：`${userData}` 取 `app.getPath('userData')`，mac 下为 `~/Library/Application Support/FileUploader`；`data.db`、`static/`、`logs/` 都在此目录下
- **新增 Node 依赖**：`node-fetch`（或内置 `http` 模块）用于健康轮询；构建脚本用 `fs-extra` 或内置 `fs` 拷贝资源
