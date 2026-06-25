## Why

`file-uploader-desktop` 仓库当前只有 `docs/` 与 `openspec/` 两个目录，没有任何工程结构。`docs/electron-packaging.md` 已规划了 6 阶段路线图，server 侧（P1）已完成 `runtime-data-paths` 与 `health-check` 改造。要继续推进 P4（fork NestJS 子进程）、P5（electron-builder 打包），必须先有一个最小可运行的 Electron 工程骨架，才能在其上叠加后续能力。本提案对应路线图的 **P3 阶段**：把骨架建起来，跑出一个能显示 loading 页的空壳 Electron 应用，并保证 desktop 与 server 的依赖版本不漂移。

## What Changes

- 在仓库根目录新增 `package.json`：
  - `devDependencies` 引入 `electron`、`electron-builder`
  - `dependencies` 抄写 `file-uploader-server/package.json` 中所有 server 生产依赖（保持版本完全一致），为 P4 fork server 子进程时 `node_modules` 解析做准备（决策 D2）
  - `scripts.start` 调用 `electron .`；`scripts.prebuild` 触发依赖同步检查
- 新增 `electron/main.js`：创建 BrowserWindow，加载本地 `loading.html`；监听 `window-all-closed` 退出
- 新增 `electron/preload.js`：占位空文件（v1 不向 renderer 暴露任何 API）
- 新增 `electron/loading.html`：极简 HTML，显示 "Initializing..." 文案，作为 P4 阶段 fork server 完成前的占位页（决策 D1）
- 新增 `scripts/check-deps-sync.js`：Node 脚本，读取 `../file-uploader-server/package.json` 的 `dependencies`，与本仓库 `dependencies` 段逐项对比；任一缺失或版本不一致以非零退出码失败
- 新增 `.gitignore`：忽略 `node_modules/`、`dist/`、`release/`、`out/`
- 新增 `README.md`：简述 `npm install` → `npm start` 的开发流程，并指向 `docs/electron-packaging.md` 作为完整路线图

**不在本提案范围**（保留给 P4/P5）：
- `child_process.fork` 启动 NestJS 子进程
- `prisma migrate deploy` 首次启动建表
- 加载前端 `dist/` 静态资源
- `/health` 轮询切换页面
- `electron-builder.yml` 与 dmg/nsis 产出
- `asarUnpack` 释放 Prisma engine（决策 D6 留待 P5）

## Capabilities

### New Capabilities
- `desktop-shell`: Electron 主进程的最小生命周期管理 —— 创建窗口、加载本地 HTML、退出清理；不包含子进程编排与前端加载（属于后续阶段的扩展）
- `dependency-sync`: desktop 与 server 生产依赖一致性的构建期校验 —— 防止 native 模块（如 Prisma engine、better-sqlite3 等）在跨仓库间漂移导致打包后运行时崩溃

### Modified Capabilities
<!-- 无：本仓库目前没有任何 spec，全部为新增 -->

## Impact

- **新增文件**：`package.json`、`electron/main.js`、`electron/preload.js`、`electron/loading.html`、`scripts/check-deps-sync.js`、`.gitignore`、`README.md`
- **跨仓库读取**：`scripts/check-deps-sync.js` 读取 `../file-uploader-server/package.json`（相对路径），运行依赖于同级目录布局
- **依赖**：引入 `electron`、`electron-builder`、以及 server 全套生产依赖（`@nestjs/*`、`@prisma/client`、`multer`、`log4js`、`dayjs` 等）；首次 `npm install` 体积较大但符合决策 D2 的预期
- **下游解锁**：P4 (fork server + 端到端联调)、P5 (electron-builder 打 mac dmg) 可在本骨架基础上分别提案
- **风险**：server 仓库后续修改 `dependencies` 时，desktop 不会自动同步 —— 由 `check-deps-sync.js` 在 prebuild 阶段以构建失败暴露差异，开发者手动同步
