## Why

本项目当前以私有个人项目形式开发，缺乏开源项目所需的基础文件（LICENSE、完整 README、贡献指南等）。在将仓库公开发布之前，需要补齐这些必要内容，以确保合法性、可发现性，并降低他人参与的门槛。

## What Changes

- 新增 `LICENSE` 文件（MIT）
- 重写 `README.md`：涵盖项目简介、架构图、多仓库目录结构要求、完整构建步骤、安全边界声明
- 新增 `CONTRIBUTING.md`：开发环境搭建、PR 流程、多仓库依赖说明
- 更新 `.gitignore`：排除 `.claude/`、`.windsurf/` 等 AI/IDE 本地配置目录
- 更新 `package.json`：补全 `description`、`author`、`license`、`repository` 字段，移除 `"private": true`
- 清理 `openspec/` 目录：该目录为内部规划工具产物，对外部贡献者无意义，移至 `.gitignore` 或添加说明

## Capabilities

### New Capabilities

- `repo-metadata`: 仓库级别的开源元数据——LICENSE 文件、package.json 的 OSS 字段（author/license/repository/description）
- `readme-oss`: 面向外部读者的完整 README，包含架构说明、多仓库依赖要求、构建步骤、安全警告
- `contributing-guide`: CONTRIBUTING.md，描述开发环境搭建流程与 PR 规范
- `gitignore-cleanup`: .gitignore 补齐，排除本地 AI 助手配置、IDE 配置等不应入库的文件

### Modified Capabilities

（无现有 spec 级行为变更）

## Impact

- `README.md`：全量重写
- `package.json`：新增字段，无逻辑变更
- `.gitignore`：追加规则，不影响已追踪文件
- 新增文件：`LICENSE`、`CONTRIBUTING.md`
- `openspec/` 目录处理方式：仅补充说明或加入 `.gitignore`，不删除现有内容
