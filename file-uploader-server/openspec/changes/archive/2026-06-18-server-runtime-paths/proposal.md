## Why

为支持 Electron 桌面打包（参见 `docs/electron-packaging.md`），server 的持久化数据路径必须可被外部进程通过环境变量重定向到 `app.getPath('userData')` 目录。当前 `static/` 上传根目录硬编码于 `FilesService` 与 `main.ts`，无法被外部注入；同时 Prisma `binaryTargets` 仅产出当前平台 engine，不利于跨平台打包。本 change 引入运行时路径模块解耦数据存储位置，并扩展 Prisma 多平台 engine 产出。

## What Changes

- 新增 `src/config/runtime-paths.ts` 集中式运行时路径模块，导出 `getDataDir()`、`getStaticDir()`
- `FilesService.archiveUploadedFile` 与 `main.ts` 的 `express.static` 不再硬编码 `static/`，改用 `getStaticDir()` 解析
- `prisma/schema.prisma` 的 `generator client` 块新增 `binaryTargets = ["native", "darwin", "darwin-arm64", "windows"]`，使 `prisma generate` 一次产出 mac (Intel/ARM) + windows engine
- 默认行为保持不变：`DATA_DIR` 未设时回退至 `process.cwd()`，`npm run start:dev` 与独立部署零回归
- `DATABASE_URL` 已是 `env("DATABASE_URL")`（无需改动），但增加文档说明外部进程注入方式

## Capabilities

### New Capabilities
- `runtime-data-paths`: server 通过环境变量声明运行时数据根目录与 SQLite 文件位置；提供集中式路径解析模块；Prisma schema 声明多平台 binaryTargets

### Modified Capabilities
- `file-archive`: 归档目录的物理根路径解析方式从字面量 `static/` 变为 `getStaticDir()`；现有归档需求不变，仅根路径来源调整

## Impact

**新增代码**
- `src/config/runtime-paths.ts`

**修改代码**
- `src/domain/files/files.service.ts`：归档路径取自 `getStaticDir()`
- `src/main.ts`：`express.static` 静态映射根目录改用 `getStaticDir()`
- `prisma/schema.prisma`：`binaryTargets` 扩展

**对外影响**
- 默认行为完全保留（无 `DATA_DIR` 环境变量时回退到 `process.cwd()`）
- 现有独立部署、开发模式、Docker 部署不受影响
- 新增的多平台 engine 二进制使 `node_modules/.prisma/client/` 体积增加约 60MB（仅开发环境，不影响线上 docker 镜像）

**风险**
- `prisma generate` 在 CI 中需要网络拉取多平台 engine，可能变慢（首次拉取后会被缓存）
