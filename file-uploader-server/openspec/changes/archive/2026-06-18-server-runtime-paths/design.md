## Context

本 change 是 Electron 桌面打包路线图（`docs/electron-packaging.md`）的 P1 第一步，对应纲领文档中的决策 D3、D9。当前 server 状态：

- `prisma/schema.prisma` 的 `datasource.url` 已是 `env("DATABASE_URL")`（开发模式从根目录 `.env` 加载）
- `prisma/schema.prisma` 的 `generator client` 仅声明 provider，未指定 binaryTargets
- `static/` 上传根目录在 `FilesService.archiveUploadedFile` 与 `main.ts` 中以字面量形式出现
- 项目通过 `dotenv` 在启动时加载 `.env`

## Goals / Non-Goals

**Goals:**
- 解耦数据存储路径与代码：通过 `DATA_DIR` 环境变量切换（默认回退 `process.cwd()`）
- 集中路径解析逻辑：所有持久化路径访问走单一模块，避免散落
- Prisma 一次 generate 产出 mac + win 多平台 engine

**Non-Goals:**
- 不改 SQLite 文件结构与 migrations
- 不引入端口动态分配
- 不改造日志目录路径（`logs/` 暂不接入 `DATA_DIR`，留给后续 change）
- 不在本 change 内启用 Electron 调用（仅准备能力）

## Decisions

### D1: 默认值用 `process.cwd()` 而非 `__dirname`
`process.cwd()` 与现状字面量 `./static/` 的解析行为完全一致（相对启动目录），保证开发模式 + 独立部署零回归。`__dirname` 在 ts-node 与编译后路径不同，反而引入风险。

### D2: 提供 `getDataDir()` + `getStaticDir()` 两层
- `getDataDir()`：根目录，未来 `logs/`、临时文件等也可放这里
- `getStaticDir()`：`getDataDir() + '/static'`，用于上传归档
- 调用方按语义选择，避免在业务代码里再次拼接 `'static'` 字面量

### D3: 模块用纯函数 + 模块级缓存，不引入 NestJS provider
路径解析无副作用、无需依赖注入、无需测试 mock；走纯函数比 NestJS provider 更轻、调用更直观（`main.ts` 在 NestJS bootstrap 之前也能用）。

### D4: `binaryTargets` 中保留 `"native"`
保证开发者本机 generate 出的 engine 能在本机运行（避免只生成 darwin/darwin-arm64/windows 时，某些 Linux/CI 环境无 engine 可用）。

### D5: `DATABASE_URL` 不抽进 runtime-paths 模块
Prisma Client 在初始化时直接读 `process.env.DATABASE_URL`，不经过应用代码。runtime-paths 模块只管文件系统路径，避免越界。

## Risks / Trade-offs

**[模块级缓存导致测试隔离问题]**
→ Mitigation：暴露 `__resetForTest()` 方法（仅 NODE_ENV=test 可用），单测时清空缓存。

**[多平台 engine 增加 node_modules 体积]**
→ Mitigation：实测约 60MB；可接受（开发环境不影响线上 docker 镜像，docker 镜像可单独覆盖 binaryTargets）。

**[未来 `DATA_DIR` 包含特殊字符（空格、中文）路径解析失败]**
→ Mitigation：`path.join` 自动处理；测试包含 `Application Support`（含空格）的真实 mac userData 路径。
