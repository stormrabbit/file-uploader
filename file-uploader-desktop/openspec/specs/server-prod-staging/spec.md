# server-prod-staging

## Purpose

优化 desktop 打包流程中 server 生产依赖的准备方式。当前方案在原 `file-uploader-server` 目录执行 `npm ci --omit=dev` 剔除 devDependencies，再执行 `npm install` 恢复，导致打包耗时过长且存在污染开发目录的风险。本提案改为在原 server 目录完成构建后，另起一个临时暂存目录 `server-prod/` 组装纯生产产物，`extraResources` 指向该目录，原 server 目录全程不受影响。

## Non-goals

- 不涉及前端（file-uploader-fe）的构建流程变更
- 不处理交叉编译场景下的 Prisma query engine 二进制替换（各平台在本机打包）
- 不修改 electron-builder 的打包目标、签名配置

## Background

### 当前问题

`prepare-resources.js` 当前流程：
1. 在 `file-uploader-server/` 执行 `npm run build`
2. 执行 `npm ci --omit=dev`（踢掉 devDependencies，缩小体积）
3. 复制 `dist/`、`node_modules/`、`prisma/` 到 `resources/server/`
4. 执行 `npm install`（恢复 devDependencies，还原开发环境）

步骤 2+4 增加了约 30-60 秒额外耗时，且若脚本中途中断会导致 server 开发目录 `node_modules` 处于仅含生产依赖的半残状态。

### Prisma 的特殊性

`@prisma/client` 在 `npm install` 时通过 `postinstall` 钩子调用 `prisma generate` 生成平台相关的 query engine（`.prisma/client/`）。`npm ci --omit=dev` 跑完后 `prisma` CLI（devDependency）不存在，`postinstall` 无法执行，需手动将原 server 目录已生成的 `.prisma/` 复制到暂存目录。

两台机器（macOS / Windows）分别在本机打包，不存在交叉编译，`.prisma/` 中的平台二进制天然正确。

## Requirements

### Requirement: 构建前在 server 目录完成 build 与 prisma generate

脚本 SHALL 在 `../file-uploader-server` 目录依次执行：
1. `npm run build`（生成 `dist/`）
2. `npx prisma generate`（确保 `.prisma/client/` 存在且为最新）

两步均须在 `file-uploader-server/` 原目录执行，不得修改其 `node_modules/`。

#### Scenario: build 与 generate 成功
- **WHEN** `../file-uploader-server` 已安装全量依赖，执行脚本
- **THEN** `../file-uploader-server/dist/main.js` SHALL 存在，`../file-uploader-server/node_modules/.prisma/client/` SHALL 存在

#### Scenario: build 失败时终止
- **WHEN** `npm run build` 返回非零退出码
- **THEN** 脚本 SHALL 立即以非零退出码终止，不继续后续步骤

---

### Requirement: 创建干净的 server-prod/ 暂存目录

脚本 SHALL 在 desktop 仓库根目录（与 `resources/` 同级）创建或重建 `server-prod/` 目录，该目录仅包含：

| 内容 | 来源 |
|------|------|
| `package.json` | 从 `../file-uploader-server/package.json` 复制 |
| `dist/` | 从 `../file-uploader-server/dist/` 复制 |
| `prisma/` | 从 `../file-uploader-server/prisma/` 复制（含 schema） |

复制完成后，在 `server-prod/` 内执行 `npm ci --omit=dev`，仅安装生产依赖。

#### Scenario: server-prod 目录重建
- **WHEN** 已存在旧的 `server-prod/`，再次执行脚本
- **THEN** 脚本 SHALL 先删除旧目录再重建，确保产物干净

#### Scenario: npm ci --omit=dev 成功
- **WHEN** 在 `server-prod/` 执行 `npm ci --omit=dev`
- **THEN** `server-prod/node_modules/` SHALL 存在，SHALL NOT 包含仅属于 devDependencies 的包（如 `@nestjs/cli`、`ts-jest`、`eslint`）

---

### Requirement: 将 .prisma/client 从 server 复制到 server-prod

`npm ci --omit=dev` 完成后，脚本 SHALL 将 `../file-uploader-server/node_modules/.prisma/` 递归复制到 `server-prod/node_modules/.prisma/`，覆盖 `npm ci` 可能生成的（或缺失的）版本。

#### Scenario: .prisma/client 存在于暂存目录
- **WHEN** 脚本执行完毕
- **THEN** `server-prod/node_modules/.prisma/client/` SHALL 存在，其内容 SHALL 与 `../file-uploader-server/node_modules/.prisma/client/` 一致

---

### Requirement: 将 server-prod/ 复制到 resources/server/

暂存目录组装完毕后，脚本 SHALL 将 `server-prod/` 的完整内容复制到 `resources/server/`（覆盖已有内容），供 `extraResources` 打包使用。

#### Scenario: resources/server 包含纯生产产物
- **WHEN** 脚本执行完毕
- **THEN** `resources/server/dist/main.js` SHALL 存在，`resources/server/node_modules/` SHALL 存在，`resources/server/node_modules/@nestjs/cli` SHALL NOT 存在

---

### Requirement: server-prod/ 与 resources/ 均不进版本控制

`.gitignore` SHALL 包含 `server-prod/` 条目（`resources/` 已有）。

#### Scenario: server-prod 被 gitignore
- **WHEN** 检查 `.gitignore`
- **THEN** SHALL 包含 `server-prod/` 条目

---

### Requirement: 原 file-uploader-server 目录全程不受修改

脚本执行的任何步骤 SHALL NOT 修改 `../file-uploader-server/node_modules/` 的内容（既不删除 devDependencies，也不执行 `npm ci`）。

#### Scenario: server 开发目录保持完整
- **WHEN** 脚本执行完毕（无论成功或失败）
- **THEN** `../file-uploader-server/node_modules/@nestjs/cli` SHALL 仍然存在

---

### Requirement: 脚本跨平台兼容（macOS / Windows）

`prepare-resources.js` SHALL 使用 Node.js 原生 API（`fs`、`child_process`、`path`）实现所有文件操作，不依赖 shell 命令（`cp`、`rm`、`mkdir` 等），确保在 macOS 和 Windows 上行为一致。

#### Scenario: Windows 上执行脚本
- **WHEN** 在 Windows 机器上执行 `npm run build`
- **THEN** 脚本 SHALL 以退出码 `0` 完成，`resources/server/` SHALL 包含正确产物
