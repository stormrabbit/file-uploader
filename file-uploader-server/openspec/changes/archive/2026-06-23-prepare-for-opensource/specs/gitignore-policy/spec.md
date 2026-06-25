## ADDED Requirements

### Requirement: .gitignore 覆盖本地配置和内部工具目录
`.gitignore` SHALL 包含以下条目，防止本地敏感文件或内部工具产物被意外提交：
- `.env`
- `config.json`
- `.claude/`
- `openspec/`

#### Scenario: .env 被忽略
- **WHEN** 开发者在根目录创建 `.env` 文件
- **THEN** `git status` 不显示该文件为待追踪或已修改文件

#### Scenario: config.json 被忽略
- **WHEN** 开发者在根目录创建 `config.json` 文件
- **THEN** `git status` 不显示该文件为待追踪或已修改文件

#### Scenario: .claude/ 目录被忽略
- **WHEN** Claude Code 在 `.claude/` 目录写入本地配置
- **THEN** `git status` 不显示该目录下任何文件

#### Scenario: openspec/ 目录被忽略
- **WHEN** 开发者使用 openspec 工具生成变更产物
- **THEN** `git status` 不显示 `openspec/` 目录下任何文件
