## ADDED Requirements

### Requirement: electron-builder.yml 配置存在且声明正确的打包目标
仓库根目录 SHALL 存在 `electron-builder.yml`，其中 SHALL 声明：`appId`（反向域名格式）、`productName: FileUploader`、`mac.target: dmg`、`mac.identity: null`（免签名）。

#### Scenario: 配置文件存在
- **WHEN** 检查仓库根目录
- **THEN** `electron-builder.yml` SHALL 存在，且可被 `electron-builder` 正确解析

#### Scenario: mac target 为 dmg 且免签名
- **WHEN** 检查 `electron-builder.yml` 的 mac 配置
- **THEN** `target` SHALL 包含 `dmg`，`identity` SHALL 为 `null`

### Requirement: files 规则将 electron/ 和 resources/ 纳入打包
`electron-builder.yml` 的 `files` 规则 SHALL 包含 `electron/**`、`resources/**`、`package.json`，并排除开发时产物（`node_modules`、`openspec`、`scripts`、`docs`）。

#### Scenario: 打包产物包含必要文件
- **WHEN** 执行 `npm run dist:mac` 并检查产出的 app 包内容
- **THEN** app 内 SHALL 包含 `electron/main.js`、`resources/server/dist/main.js`、`resources/web/pages/pc/index.html`

#### Scenario: 打包产物不含开发工具
- **WHEN** 检查打包产出的 app 包
- **THEN** SHALL NOT 包含 `openspec/`、`scripts/`、`docs/` 目录

### Requirement: asarUnpack 释放 Prisma engine .node 文件
`electron-builder.yml` 的 `asarUnpack` 规则 SHALL 覆盖 `resources/server/node_modules/.prisma/client/*.node` 和 `resources/server/node_modules/prisma/*.node`，确保 Prisma query engine 二进制释放到 `app.asar.unpacked/` 目录下可被 Node 直接加载。

#### Scenario: Prisma .node 在 asar 外可访问
- **WHEN** 安装 dmg 后启动应用
- **THEN** server 子进程 SHALL 成功加载 Prisma engine，不出现 "cannot open shared object" 或 mmap 相关错误；server.log SHALL 无 Prisma engine 加载失败记录

### Requirement: npm run dist:mac 产出 .dmg 文件
`package.json` 的 `scripts` SHALL 包含 `dist:mac` 脚本，执行后在 `dist/` 目录下产出 `FileUploader-*.dmg`。

#### Scenario: dist:mac 产出 dmg
- **WHEN** 执行 `npm run dist:mac`
- **THEN** `dist/FileUploader-*.dmg` SHALL 存在，文件大小大于 50MB（包含完整 node_modules）

### Requirement: 安装后首次启动完成完整链路
从 dmg 安装的应用 SHALL 在首次启动时自动完成数据库迁移，切换到前端页面，文件上传/下载/列表/删除全部可用。

#### Scenario: 安装后首次启动建库并展示前端
- **WHEN** 从 dmg 安装应用后首次双击启动（或右键→打开）
- **THEN** 应用 SHALL 依次显示 loading 页、完成 prisma migrate deploy、切换到前端 PC 页面

#### Scenario: 安装后上传文件成功
- **WHEN** 前端页面加载后，用户选择文件并点击上传
- **THEN** 文件 SHALL 上传成功，出现在文件列表中，`${userData}/static/` 下 SHALL 存在对应文件

#### Scenario: userData 目录结构正确
- **WHEN** 应用首次启动后检查 `~/Library/Application Support/FileUploader/`
- **THEN** SHALL 存在 `data.db`、`logs/server.log`，上传文件后 SHALL 存在 `static/` 子目录
