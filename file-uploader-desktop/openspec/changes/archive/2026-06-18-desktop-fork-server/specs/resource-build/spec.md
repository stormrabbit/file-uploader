## ADDED Requirements

### Requirement: prepare-resources.js 触发 server 构建并拷贝产物
系统 SHALL 提供 `scripts/prepare-resources.js`，执行时顺序完成：① 在 `../file-uploader-server` 目录执行 `npm run build`；② 将 server 的 `dist/`、`node_modules/`、`prisma/` 目录递归拷贝到本仓库 `resources/server/`（覆盖已有内容）。任一步骤失败时脚本 SHALL 以非零退出码终止并输出明确错误信息。

#### Scenario: server build 产物被拷贝
- **WHEN** 在 desktop 根目录执行 `node scripts/prepare-resources.js`，且 `../file-uploader-server` 已安装依赖
- **THEN** `resources/server/dist/main.js` SHALL 存在，`resources/server/node_modules/` SHALL 存在，`resources/server/prisma/` SHALL 存在

#### Scenario: server 仓库不存在时报错
- **WHEN** `../file-uploader-server` 目录不存在时执行脚本
- **THEN** 脚本 SHALL 以非零退出码退出并在 stderr 输出含路径的错误信息

### Requirement: prepare-resources.js 触发前端构建并注入 API base URL
系统 SHALL 在执行前端构建时通过环境变量注入 `VITE_API_BASE_URL=http://127.0.0.1:38902/`，使前端 build 产物内联桌面端的 API 地址；构建完成后将 `../file-uploader-fe/dist/` 递归拷贝到本仓库 `resources/web/`（覆盖已有内容）。

#### Scenario: 前端产物包含桌面端 API base URL
- **WHEN** 执行 `node scripts/prepare-resources.js` 后检查前端产物
- **THEN** `resources/web/pages/pc/index.html` SHALL 存在；前端 JS bundle 中 SHALL 包含 `http://127.0.0.1:38902/` 字符串（由 Vite build 内联）

#### Scenario: resources/web 覆盖写入
- **WHEN** `resources/web/` 已存在旧产物，再次执行脚本
- **THEN** 脚本 SHALL 先清空或覆盖写入，不保留旧产物

### Requirement: package.json scripts.build 执行 prepare-resources.js
`package.json` 的 `scripts.build` SHALL 为 `node scripts/prepare-resources.js`，且 `scripts.prebuild`（依赖同步校验）在 build 之前自动触发。

#### Scenario: npm run build 执行资源准备
- **WHEN** 执行 `npm run build`
- **THEN** npm SHALL 先触发 `prebuild`（check-deps），再执行 `prepare-resources.js`；若 check-deps 失败则 build SHALL 不执行

### Requirement: resources/ 目录不进版本控制
`.gitignore` SHALL 包含 `resources/` 条目，确保构建产物不被 git 追踪。

#### Scenario: resources 被 gitignore
- **WHEN** 检查 `.gitignore`
- **THEN** SHALL 包含 `resources/` 或 `resources/server/` 与 `resources/web/` 条目
