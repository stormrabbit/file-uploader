## ADDED Requirements

### Requirement: CONTRIBUTING.md 说明开发环境搭建
`CONTRIBUTING.md` SHALL 包含完整的本地开发环境搭建步骤，包括克隆三个仓库、安装依赖、启动开发模式的命令。

#### Scenario: 新贡献者可独立搭建环境
- **WHEN** 按照 CONTRIBUTING.md 的步骤执行
- **THEN** 执行 `electron .`（或 `npm start`）后 Electron 窗口正常启动并加载前端页面

### Requirement: CONTRIBUTING.md 解释多仓库依赖原因
`CONTRIBUTING.md` SHALL 解释 `scripts/prepare-resources.js` 和 `scripts/check-deps-sync.js` 依赖兄弟仓库的技术原因，使贡献者理解为何需要特定的目录结构。

#### Scenario: 多仓库依赖说明存在
- **WHEN** 读取 CONTRIBUTING.md
- **THEN** 文档包含描述 `../file-uploader-server` 和 `../file-uploader-fe` 路径约定的段落，并说明 `check-deps-sync.js` 的作用

### Requirement: CONTRIBUTING.md 包含 PR 提交规范
`CONTRIBUTING.md` SHALL 包含至少一条 PR 提交规范，说明 commit message 语言（中文/英文均可）和分支命名约定。

#### Scenario: PR 规范可见
- **WHEN** 读取 CONTRIBUTING.md
- **THEN** 文档包含关于如何提交 PR 的段落，包括分支命名或 commit 格式的说明
