## Why

P4 阶段已验证应用在开发模式（`npm run build && npm start`）下完整运行。P5 目标是将其打包成一个用户可安装的 macOS dmg，使任何人都能双击安装、无需 Node/npm 环境直接使用。这是"桌面端单机使用"承诺的最后一块拼图。

## What Changes

- **新增 `electron-builder.yml`**：配置打包目标（mac dmg）、文件包含规则、asarUnpack 释放 Prisma engine、免签名（identity: null）
- **`package.json` 新增 `scripts.dist:mac`**：一键触发 electron-builder 打包
- **`electron/main.js` 路径适配**（**BREAKING** — 修改资源路径常量）：打包后 `__dirname` 指向 asar 内部，`resources/` 目录位置发生变化，需要通过 `app.isPackaged` 区分开发/打包两种路径
- **`scripts/prepare-resources.js` 无需修改**：Prisma .node 文件已在 `resources/server/node_modules/.prisma/client/` 下，electron-builder 通过 asarUnpack 规则处理

**不在本提案范围**：代码签名与 Notarization（需要 Apple Developer 账号）、Windows 打包（P6）、自动更新（未规划）

## Capabilities

### New Capabilities
- `mac-packaging`: 通过 electron-builder 将应用打包为可分发的 macOS dmg；包含 asar 打包、Prisma engine 释放、免签名配置

### Modified Capabilities
- `desktop-shell`: 主进程资源路径需适配 `app.isPackaged` 两种场景（开发模式 vs 打包模式），影响 `SERVER_MAIN`、`SERVER_NODE_MODULES`、`WEB_INDEX` 常量定义

## Impact

- **新增文件**：`electron-builder.yml`
- **修改文件**：`electron/main.js`（路径常量）、`package.json`（新增 dist:mac 脚本）
- **打包产物**：`dist/FileUploader-*.dmg`（已在 .gitignore 的 `dist/` 下）
- **运行时路径变化**：打包后 `process.resourcesPath` 指向 app 内的 resources 目录，`__dirname` 在 asar 内部；两者结合可正确定位所有资源
- **Gatekeeper**：免签名 dmg 首次运行需右键→打开；不影响功能
