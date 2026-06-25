## ADDED Requirements

### Requirement: 清理根目录截图文件
仓库根目录 SHALL 不包含 `ScreenShot_*.png` 等与项目无关的临时截图文件。`.gitignore` SHALL 追加 `ScreenShot_*.png` 规则防止再次提交。

#### Scenario: 仓库 clone 后无截图文件
- **WHEN** 用户 clone 仓库
- **THEN** 根目录不存在 `ScreenShot_*.png` 等截图文件

#### Scenario: 后续截图文件不被 git 追踪
- **WHEN** 开发者在根目录生成新的 `ScreenShot_*.png`
- **THEN** `git status` 不显示该文件（被 .gitignore 忽略）

### Requirement: docs/ 目录纳入版本控制
`.gitignore` SHALL 移除 `docs` 行，使 `docs/` 目录下的文档文件（`ISSUES.md`、`IMPROVEMENT.md`、`REFACTOR_PLAN.md`）对所有贡献者可见。文档内容 SHALL 不包含敏感信息（IP、密码、个人隐私）。

#### Scenario: 贡献者 clone 后能看到 docs 目录
- **WHEN** 贡献者 clone 仓库并进入项目目录
- **THEN** `docs/` 目录及其内部文档文件均存在且可读

#### Scenario: docs 文件无敏感信息
- **WHEN** 代码 reviewer 审查 docs/*.md 内容
- **THEN** 文档中不包含私有 IP 地址、密码、个人姓名或其他敏感信息

### Requirement: .env.example 包含所有必要配置项
仓库 SHALL 包含 `.env.example` 文件，列出所有 `VITE_*` 环境变量及其说明，帮助贡献者快速配置本地开发环境。`.env` 文件 SHALL 在 `.gitignore` 中，不被提交。

#### Scenario: 新贡献者能快速配置环境变量
- **WHEN** 贡献者 clone 仓库后查看 `.env.example`
- **THEN** 能看到所有必要的环境变量（如 `VITE_API_BASE_BACKEND_PORT`）及说明，复制后修改即可使用
