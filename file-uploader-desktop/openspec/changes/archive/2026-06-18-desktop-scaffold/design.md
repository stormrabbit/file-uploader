## Context

`file-uploader-desktop` 是 `docs/electron-packaging.md` 路线图中规划的第三个仓库，目标是把 NestJS server (`file-uploader-server`) 与 Vue 前端 (`file-uploader-fe`) 打包成单一桌面应用。本提案聚焦 P3 阶段：建立可运行但功能极简的 Electron 工程骨架，作为 P4（fork server + 端到端联调）和 P5（electron-builder 打包）的承载基座。

**当前状态**：
- 仓库根目录除 `docs/` 与 `openspec/` 外为空
- `file-uploader-server` 已完成 `runtime-data-paths`、`health-check` capability，可通过 `DATA_DIR` + `DATABASE_URL` 环境变量驱动持久化路径，并暴露 `GET /health`
- 前端仓库 (`file-uploader-fe`) 待验证

**关键约束**：
- desktop 与 server 同级目录布局：`../file-uploader-server` 是稳定的相对路径前提
- 决策 D1（fork 子进程，不内嵌）、D2（独立装一份生产依赖）、D6（asarUnpack）已在路线图中固化
- v1 不支持端口动态分配（决策 D5），server 默认端口 38902 在 P4 才会接进来

## Goals / Non-Goals

**Goals:**
- 一份可 `npm install && npm start` 跑出 loading 页的最小 Electron 工程
- 与 server `dependencies` 严格同步的依赖锁定机制（防 native 模块漂移）
- 清晰的目录约定（`electron/` 主进程代码、`scripts/` 工具脚本），让 P4/P5 增量改动落点明确
- 文档化的入口（README + docs 链接），让接手者能在 5 分钟内理解仓库定位

**Non-Goals:**
- 不 fork NestJS 子进程（P4 范围）
- 不加载前端构建产物（P4 范围）
- 不实现 `/health` 轮询切换页面（P4 范围）
- 不出 dmg / nsis 安装包（P5 范围）
- 不配置 `asarUnpack` / `electron-builder.yml`（P5 范围）
- 不引入 TypeScript（v1 主进程代码用 CommonJS JS，避免引入构建链路；后续若复杂度上升再评估）
- 不引入 ESLint / Prettier（v1 文件量极少，过早引入工具链增加心智负担）

## Decisions

### D-S1: 主进程使用 CommonJS JavaScript，不上 TypeScript

**选择**：`electron/main.js`、`electron/preload.js`、`scripts/check-deps-sync.js` 全部用 CommonJS `require` 语法的 .js 文件。

**理由**：v1 阶段主进程代码总量预计 < 200 行，引入 TS 需要配 tsconfig + build 步骤 + 调整 `main` 字段指向 dist，收益不抵成本。Electron 官方文档与 electron-builder 也都默认假设 CommonJS。后续若主进程复杂度真的上升（例如 P4 引入子进程编排、IPC 协议），再单独提案迁移到 TS。

**备选**：用 TS + esbuild 编译 → 否决（过度工程化）。

### D-S2: 依赖同步采用「desktop 抄写 server」单向模型

**选择**：`scripts/check-deps-sync.js` 把 server 的 `dependencies` 视为权威源，desktop 只做对比，不反向同步。任何漂移以非零退出码失败。

**理由**：server 是业务真理之源（路由、数据库、文件处理逻辑都在那），desktop 只是承载运行时。让 server 单向驱动版本，避免双向同步的循环依赖。校验在 prebuild 阶段执行，让漂移在最早期暴露（决策 D2 的具体实施）。

**对比维度**：仅对比 `dependencies` 段（不含 devDependencies），逐键 key + 完全相等的 version 字符串。版本范围匹配（如 `^5.22.0` vs `~5.22.0`）算漂移 —— 严格优于宽松。

**备选**：
- `npm workspaces` 共享 `node_modules` → 否决：路线图明确 desktop 独立装一份，便于跨平台 native rebuild（决策 D2）
- 双向自动同步脚本 → 否决：会让 desktop 也变成依赖源，违反单一权威

### D-S3: loading.html 是静态 HTML，不引入 renderer 框架

**选择**：`electron/loading.html` 是原生 HTML + 内联 CSS，<50 行。`preload.js` 是空文件（保留 `contextIsolation: true` 默认值）。

**理由**：loading 页生命周期极短（v1 永远显示，P4 引入 health 轮询后只在启动期可见），不值得引入 Vue/React。且这是 Electron 自带的本地资源，不走 server，无需向 renderer 注入任何 API。

### D-S4: package.json 的 `main` 字段指向 `electron/main.js`

**选择**：`"main": "electron/main.js"`，并把 `"type"` 字段保持为默认（CommonJS）。

**理由**：与 D-S1 一致；electron-builder 默认从 `main` 字段开始打包，符合社区惯例。

### D-S5: BrowserWindow 初始尺寸 1200x800，可缩放

**选择**：`new BrowserWindow({ width: 1200, height: 800, webPreferences: { preload: ..., contextIsolation: true, nodeIntegration: false } })`。

**理由**：1200x800 是文件管理类应用的常见初始尺寸，足够展示前端的列表 + 操作栏布局；`contextIsolation: true` + `nodeIntegration: false` 是 Electron 安全基线，必须从 v1 就锁定，避免后续放开困难。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| server 修改 `dependencies` 后 desktop 未同步 → 打包后运行时崩溃 | `check-deps-sync.js` 挂在 prebuild，开发者运行 `npm run build` 即触发；CI 也可单独跑此脚本 |
| 用户克隆仓库时未同时拉取 `file-uploader-server`，`check-deps-sync.js` 找不到对照 | 脚本对 server `package.json` 不存在场景给出明确报错信息（"未找到同级 server 仓库，请确认目录布局"），不静默跳过 |
| Electron 版本与 server 依赖中某些 native 模块（如 Prisma 的 .node）的 N-API 兼容性 | 本提案不涉及 native rebuild；P4 接入 fork server 时若发现 ABI 不匹配，再评估 `electron-rebuild` 或锁定 Electron major 版本 |
| CommonJS 与未来 server ESM 化的兼容性 | server 当前 `@nestjs/common@^7` 是 CJS；若未来升级到 NestJS 10+ 或全 ESM，desktop 主进程也需要同步迁移。本提案不预先适配 |
| 抄写 server 全套生产依赖（含 mongoose、mysql 等历史遗留）体积过大 | 接受 —— 与 server 严格对齐优先于体积优化；server 后续清理无用依赖时 desktop 自动跟随 |
| Windows 路径中的反斜杠在 `check-deps-sync.js` 跨平台读取 `../file-uploader-server/package.json` 时出错 | 脚本统一使用 `path.join(__dirname, '..', '..', 'file-uploader-server', 'package.json')`，Node 自动处理分隔符 |

## Migration Plan

不适用 —— 这是新仓库的首次引入，没有现有用户或部署需要迁移。

## Open Questions

- **package name**：使用 `file-uploader-desktop` 还是 `gengar-desktop`（server 的 `name` 是 `gengar`）？→ 决议：`file-uploader-desktop`，与仓库目录名一致，避免引入 server 的内部代号。
- **electron 版本**：锁 30.x（最新稳定）还是更保守的 28.x LTS？→ 决议：选最新稳定（30.x 系列），P5 打包阶段如遇兼容问题再降。
- **scripts/check-deps-sync.js 是否对比 devDependencies**：→ 决议：v1 不对比，只锁生产依赖（运行时安全是首要目标，devDeps 漂移不会影响打包产物运行）。
