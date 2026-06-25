## ADDED Requirements

### Requirement: README 包含安全警告
`README.md` SHALL 在正文首屏包含关于无鉴权设计的安全边界声明，明确列出允许和不允许的部署场景。

#### Scenario: 安全警告在首屏可见
- **WHEN** 在 GitHub 仓库页查看 README
- **THEN** 无需滚动即可看到包含"无鉴权"或"安全提示"的警告块

### Requirement: README 描述多仓库目录结构
`README.md` SHALL 包含展示三个兄弟仓库目录结构的代码块，说明 `file-uploader-server`、`file-uploader-fe`、`file-uploader-desktop` 须位于同一父目录下。

#### Scenario: 目录结构代码块存在
- **WHEN** 读取 README.md
- **THEN** 存在包含 `file-uploader-server/`、`file-uploader-fe/`、`file-uploader-desktop/` 三行的目录树代码块

### Requirement: README 包含完整构建步骤
`README.md` SHALL 包含从零开始到产出可运行应用的完整命令序列，步骤按顺序编号，包含所有前置条件（Node.js 版本等）。

#### Scenario: 构建命令可复现
- **WHEN** 按照 README 中的步骤执行
- **THEN** 执行 `npm install`、`npm run build`、`npm run dist:mac` 后可在 `dist/` 目录找到 DMG 文件

### Requirement: README 说明项目架构
`README.md` SHALL 包含描述 Electron 主进程 fork NestJS 子进程、静态服务器对外提供前端页面的架构说明，使读者理解三个仓库各自的角色。

#### Scenario: 架构说明覆盖三个组件
- **WHEN** 读取 README 中的架构说明
- **THEN** 文本或图表中明确提及 Electron 宿主、NestJS 后端子进程、Vue 3 前端这三个组件及其通信方式（端口 38902/38903）
