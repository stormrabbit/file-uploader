## Context

`file-uploader-server`（代号 gengar）是一个个人/局域网文件管理服务，基于 NestJS v7 + Prisma + SQLite 构建。项目即将开源，但仓库中存在以下问题：

- `README.md` 描述的是已被移除的 MySQL + JWT 旧架构，含明文密码
- `config.json` 硬编码个人磁盘路径（`/Users/yangguang17/Desktop`），未被 `.gitignore` 忽略
- `.env` 未被 `.gitignore` 忽略
- 缺少 `LICENSE` 文件（无协议 = 默认保留所有权利）
- `db.sql` 为旧 MySQL schema，与当前 Prisma 架构无关
- `CLAUDE.md`、`.claude/`、`openspec/` 为内部工具产物，不应对外暴露

本次变更纯属仓库治理，无任何运行时代码改动。

## Goals / Non-Goals

**Goals:**
- 消除仓库中所有隐私泄露风险（个人路径、明文密码）
- 补齐开源必要文件（LICENSE、README、配置模板）
- 正确配置 `.gitignore`，防止本地文件被意外提交
- 使任何人可以克隆仓库并按文档完成本地部署

**Non-Goals:**
- 不修改任何业务逻辑或 API 行为
- 不添加鉴权层（部署边界策略已在 CLAUDE.md 中明确，保持不变）
- 不迁移技术栈

## Decisions

### 决定 1：LICENSE 使用 MIT

**选择**：MIT License  
**理由**：个人工具项目，最宽松的主流协议，兼容性最好，无副作用。  
**备选**：Apache 2.0（需要 NOTICE 文件）、GPL（传染性，不适合工具库）

### 决定 2：删除 CLAUDE.md 而非保留

**选择**：删除 `CLAUDE.md`  
**理由**：`CLAUDE.md` 包含内部 AI 协作指令和私有工作流描述（`openspec/changes/server-remove-auth-users/` 等路径），对外部贡献者无意义且可能暴露内部信息。  
**备选**：保留并脱敏 → 内容价值低，维护成本高，不值得

### 决定 3：删除 db.sql 而非保留为参考

**选择**：删除 `db.sql`  
**理由**：旧 MySQL schema 与当前 Prisma + SQLite 架构完全不同，保留只会误导读者。当前数据模型已由 `prisma/schema.prisma` 完整描述。  

### 决定 4：config.json 移入 .gitignore 并提供 example

**选择**：将 `config.json` 加入 `.gitignore`，新增 `config.json.example`  
**理由**：`config.json` 中的 `storageDir` 是本机特定路径，不应进入版本控制。提供 example 文件让用户知道需要创建并填写此文件。

## Risks / Trade-offs

- **风险**：重写 README 可能遗漏重要部署细节 → **缓解**：参照 CLAUDE.md 中已有的架构说明和环境变量表格
- **风险**：删除 CLAUDE.md 后 AI 助手在新会话中缺少上下文 → **接受**：开源后可按需重建，或将必要信息迁移至 README/docs
- **风险**：git 历史中仍残留旧个人信息（commit author） → **缓解**：配合前置的 `git init` 重置历史（用户已决定执行）
