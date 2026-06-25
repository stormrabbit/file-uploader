## ADDED Requirements

### Requirement: 项目包含开源必备文件
仓库根目录 SHALL 包含 `LICENSE`、`README.md`、`.env.example`、`config.json.example` 四个文件，使任何人可以克隆后按文档完成本地部署，无需询问原作者。

#### Scenario: 克隆后存在 LICENSE 文件
- **WHEN** 用户克隆仓库
- **THEN** 根目录存在 `LICENSE` 文件，内容为标准 MIT License，年份和版权人已填写

#### Scenario: README 准确描述当前架构
- **WHEN** 用户阅读 `README.md`
- **THEN** 文档描述的技术栈（NestJS + Prisma + SQLite）与实际代码一致，不含已移除的 MySQL/JWT 内容，不含任何明文密码或个人路径

#### Scenario: .env.example 列出所有必要环境变量
- **WHEN** 用户查看 `.env.example`
- **THEN** 文件列出 `PORT`、`DATABASE_URL` 等所有必要变量及默认值说明，无真实敏感值

#### Scenario: config.json.example 提供配置模板
- **WHEN** 用户查看 `config.json.example`
- **THEN** 文件列出 `storageDir` 字段并注明需要填写为本机路径，值为示例占位符而非真实路径

### Requirement: 仓库不包含内部工具产物
仓库 SHALL NOT 包含 `db.sql`、`CLAUDE.md` 文件，这些文件描述已废弃的架构或内部 AI 协作工作流，对外部用户无价值且存在信息泄露风险。

#### Scenario: db.sql 已从仓库移除
- **WHEN** 用户克隆仓库
- **THEN** 根目录不存在 `db.sql` 文件

#### Scenario: CLAUDE.md 已从仓库移除
- **WHEN** 用户克隆仓库
- **THEN** 根目录不存在 `CLAUDE.md` 文件
