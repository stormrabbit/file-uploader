## Context

P3 (desktop-scaffold) 已交付最小 Electron 骨架：`electron/main.js` 创建窗口 + 加载静态 loading 页，`scripts/check-deps-sync.js` 保证 desktop 与 server 依赖不漂移。P4 要在这个骨架上接入真实的后端与前端，打通"双击 → 上传文件"的完整链路。

**现状**：
- `file-uploader-server` 已完成 `runtime-data-paths`、`health-check` 两个 capability，`dist/main.js` 存在且可通过 `DATA_DIR`、`DATABASE_URL`、`PORT` env 驱动
- `file-uploader-fe` `dist/` 已存在，`apiBase.ts` 优先读 `VITE_API_BASE_URL` env，build 期可写死 base URL
- `prisma/schema.prisma` 已声明 `binaryTargets = ["native", "darwin", "darwin-arm64", "windows"]`，`prisma migrate deploy` 可在无 dev dependency 下执行

**约束**：
- 路线图决策 D1（fork 子进程）、D3（userData 路径）、D4（前端 baseURL build 期写死）、D5（v1 不处理端口冲突）、D8（首启 migrate deploy）已固化
- P5 才做 electron-builder 打包，本提案产物以"开发模式 `npm run build && npm start`"为交付标准

## Goals / Non-Goals

**Goals:**
- `npm run build` 能一键编排 server + 前端 build 并将产物落到 `resources/`
- `npm start` 后 Electron 主窗口最终呈现前端 PC 页面，可完成文件上传
- 子进程日志落盘，启动失败时展示可读的错误页（含日志路径）
- `before-quit` 时子进程被 kill，不留孤儿进程

**Non-Goals:**
- electron-builder 打包 / dmg 产出（P5）
- asarUnpack 处理 Prisma engine（P5）
- 动态端口探测（v2）
- Windows 兼容验证（P6）
- 前端热重载 / 开发代理（桌面端不需要）

## Decisions

### D-F1: prepare-resources.js 用 Node `execSync` 同步执行构建命令

**选择**：`scripts/prepare-resources.js` 通过 `child_process.execSync` 顺序触发两次构建，stdio 继承到终端（`stdio: 'inherit'`），完成后用 `fs.cpSync`（Node 16.7+）或递归 cp 拷贝产物。

**理由**：构建是串行的（server build → 前端 build → 拷贝），不需要并行；同步 API 让脚本逻辑清晰，失败时直接抛出并终止；继承 stdio 让开发者能实时看到 tsc/vite 输出。

**备选**：用 `execa` npm 包 → 否决（纯内置模块可满足需求，无需额外依赖）。

### D-F2: 前端 build 注入 VITE_API_BASE_URL 通过 env 前缀实现

**选择**：`prepare-resources.js` 在调用前端 build 时设 `env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:38902/' }`，让 `execSync` 继承当前进程 env 并叠加该变量。

**理由**：`apiBase.ts` 已有 `if (import.meta.env.VITE_API_BASE_URL)` 分支；build 期 Vite 会将该变量内联到产物中，运行时不依赖任何网络配置文件。符合决策 D4，且独立部署（不设该 env）仍回退到 `window.location.hostname` 逻辑，零侵入。

### D-F3: 健康轮询用 Node 内置 `http` 模块，不引入 node-fetch

**选择**：使用 `http.get('http://127.0.0.1:38902/health', ...)` 包装为 Promise，轮询间隔 500ms，30s 超时。

**理由**：Electron 主进程运行在 Node 环境，`http` 模块开箱可用；node-fetch v3 是 ESM-only，在 CJS 主进程中引入需要额外配置；axios 体积过大。轮询逻辑 < 20 行，不值得引入外部依赖。

**备选**：`net.createConnection` 探测 TCP 端口是否开放（比 HTTP 请求更轻量） → 否决：端口开放不代表 NestJS 已完成 `app.listen()`，health endpoint 返回 200 才是真正就绪信号。

### D-F4: prisma migrate deploy 在主进程同步执行（spawnSync）

**选择**：检测到 `data.db` 不存在时，用 `spawnSync('node', ['node_modules/.bin/prisma', 'migrate', 'deploy'], { env: {..., DATABASE_URL}, stdio: 'pipe' })` 同步建表。执行期间 loading 页已在前台，用户有视觉反馈。

**理由**：migrate deploy 是一次性操作（后续启动跳过），同步执行保证在 fork server 之前数据库必然存在，避免竞态；`stdio: 'pipe'` 将输出写日志，不弹终端窗口。

**备选**：让 server 启动时自动执行 migrate → 否决：需要修改 server 代码，且 server 是独立仓库，桌面端不应向 server 注入启动逻辑。

### D-F5: 子进程异常时渲染内嵌 HTML 错误页，而非加载 error.html 文件

**选择**：`win.loadURL('data:text/html,...')` 传入内嵌 HTML 字符串，将错误信息与日志路径插值其中。`electron/error.html` 作为模板存储在仓库，运行时由主进程读取并填充变量后以 data URL 加载。

**理由**：data URL 加载无需文件系统路径计算，在打包后（asar 内）同样可靠；error.html 模板保持可读性，不把 HTML 字符串硬编码在 JS 里。

### D-F6: resources/ 目录加入 .gitignore，不提交构建产物

**选择**：`resources/server/` 和 `resources/web/` 加入 `.gitignore`，每次开发前需跑 `npm run build` 重新准备。

**理由**：server `node_modules` 体积 > 200MB，前端 dist 是二进制压缩产物，两者都不应进版本控制。`prepare-resources.js` 是可重复执行的，CI/CD 阶段同样跑此脚本即可。

### D-F7: 日志文件路径约定 `${userData}/logs/server.log`

**选择**：主进程在 fork 子进程前确保 `${userData}/logs/` 目录存在（`fs.mkdirSync(..., {recursive: true})`），用 `fs.createWriteStream` 以 `flags: 'a'`（追加）模式打开 `server.log`，将子进程 stdout/stderr pipe 过去。

**理由**：追加模式保留历史日志便于排查多次启动问题；文件路径在错误页中直接展示，用户可在 Finder 中打开。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| NestJS 子进程启动超过 30s（低端机/首次 migrate） | migrate deploy 在 fork 之前完成，不计入 30s；30s 超时只计算 server listen 阶段，一般 < 5s |
| `child_process.fork` 要求模块为 CJS，但 NestJS dist 是 CJS | NestJS 7 编译产物是 CJS `require`，直接 fork 无问题；升级到 NestJS 10 ESM 时需重新评估 |
| 端口 38902 被占用导致子进程启动失败 | 子进程以非零退出码退出 → 触发 `exit` 事件 → 显示错误页（决策 D5，v1 接受此行为） |
| `fs.cpSync` 在 Node < 16.7 不可用 | Electron 30 内置 Node 20.x，不存在此问题 |
| 重复点击 app icon 二次启动时出现两个 server 进程 | 使用 `app.requestSingleInstanceLock()` 确保单实例；第二个实例直接退出 |
| prepare-resources.js 拷贝 server node_modules 耗时长（>1min） | 接受 —— 这是开发时一次性操作；生产打包（P5）由 electron-builder 处理，不走此脚本 |
| server.log 无限增长 | v1 不做日志轮转；v2 或 P5 阶段引入 log rotation |

## Migration Plan

无数据迁移。现有 P3 骨架文件：
- `electron/main.js` — 完全替换（BREAKING）
- `package.json` — 更新 `scripts.build` 字段
- `.gitignore` — 追加 `resources/`

## Open Questions

- **resources/server/node_modules 拷贝策略**：全量拷贝 vs 只拷 Prisma 相关。→ 决议：v1 全量拷贝（简单可靠）；P5 打包阶段 electron-builder 会做 tree-shaking。
- **前端入口**：`resources/web/pages/pc/index.html` —— 已确认 `file-uploader-fe` build 产物结构为 `dist/pages/pc/index.html`，拷贝后路径正确。
- **单实例锁**：是否在本提案实现。→ 决议：实现，防止重复启动导致端口冲突与双 server 进程。
