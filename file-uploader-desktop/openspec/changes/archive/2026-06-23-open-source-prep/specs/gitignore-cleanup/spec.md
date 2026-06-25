## ADDED Requirements

### Requirement: .gitignore 排除 AI 助手本地配置
`.gitignore` SHALL 包含 `.claude/` 规则，确保 Claude Code 的本地配置（`settings.local.json` 等）不被追踪入库。

#### Scenario: .claude 目录不被 git 追踪
- **WHEN** 在 `.claude/` 目录下创建任意文件后执行 `git status`
- **THEN** 该文件显示为 untracked 且不在 staged 文件中

### Requirement: .gitignore 排除 IDE 专用目录
`.gitignore` SHALL 包含 `.windsurf/` 规则，排除 Windsurf IDE 的本地配置目录。

#### Scenario: .windsurf 目录不被 git 追踪
- **WHEN** 在 `.windsurf/` 目录下创建任意文件后执行 `git status`
- **THEN** 该文件显示为 untracked

### Requirement: .gitignore 追加规则不影响已追踪文件
追加 `.gitignore` 规则后，已被 git 追踪的文件 SHALL 不受影响（不会意外变为 untracked）。

#### Scenario: 已追踪文件不受影响
- **WHEN** 修改 `.gitignore` 添加新规则后执行 `git status`
- **THEN** 之前已追踪的文件（如 `electron/main.js`、`package.json` 等）状态不变
