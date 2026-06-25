## Why

本项目计划开源，但当前仓库存在隐私泄露风险（硬编码个人路径、明文密码残留）、过时文档（描述已移除的 MySQL/JWT 功能）及缺少开源必要文件（LICENSE、.env.example）。需要在发布前完成清理，使项目对外可用且合规。

## What Changes

- 修复 `.gitignore`，新增排除 `.env`、`config.json`、`.claude/`、`openspec/` 等本地/内部文件
- 新增 `.env.example`，提供环境变量配置模板
- 完全重写 `README.md`，移除旧 MySQL/JWT 内容和明文密码，准确描述当前 NestJS + Prisma + SQLite 架构
- 新增 `LICENSE` 文件（MIT 协议）
- 删除 `db.sql`（旧 MySQL schema，已被 Prisma 替代，会误导读者）
- 新增 `config.json.example` 作为配置模板，将 `config.json` 从 git 追踪中移除
- 移除 `CLAUDE.md`（内部 AI 协作指令，不对外暴露）

## Capabilities

### New Capabilities

- `opensource-baseline`: 开源必备基础文件集合（LICENSE、README、.env.example、config 模板），使任何人可以克隆并运行本项目

### Modified Capabilities

- `gitignore-policy`: 扩展忽略规则，覆盖本地配置文件和内部工具目录

## Impact

- **文件变更**: `.gitignore`、`README.md`、`LICENSE`（新增）、`.env.example`（新增）、`config.json.example`（新增）、`db.sql`（删除）、`CLAUDE.md`（删除）
- **无 API/代码逻辑变更**：本次变更纯属仓库治理，不影响任何运行时行为
- **git 历史**：需配合重 init 操作（见前置讨论），清除含个人身份信息的历史提交
