## ADDED Requirements

### Requirement: 项目 README 完整描述项目
仓库根目录的 `README.md` SHALL 包含项目介绍、功能列表、截图或演示说明、快速上手（本地开发）、部署指南、架构说明、技术栈，以中文为主、英文摘要为辅，替换 Vue 官方模板的默认内容。

#### Scenario: 访客能快速了解项目用途
- **WHEN** 用户访问 GitHub 仓库首页
- **THEN** README 展示项目用途（局域网文件同步工具）、主要功能、PC/Mobile 截图说明

#### Scenario: 开发者能快速在本地跑起来
- **WHEN** 开发者阅读 README 的"快速上手"章节
- **THEN** 按照步骤执行 `npm install && npm run dev` 能成功启动开发服务器

#### Scenario: 运维能了解部署方式
- **WHEN** 运维阅读 README 的"部署"章节
- **THEN** 能了解 Nginx 配置、PC/Mobile 访问路径、端口约定

### Requirement: 仓库包含 MIT LICENSE 文件
仓库根目录 SHALL 包含 `LICENSE` 文件，内容为 MIT License，年份与当前年份一致，版权持有人为项目作者。

#### Scenario: 用户查看开源协议
- **WHEN** 用户访问仓库 LICENSE 文件
- **THEN** 文件显示标准 MIT License 全文，包含正确年份和作者信息

### Requirement: 包含 CONTRIBUTING.md 贡献指南
仓库根目录 SHALL 包含 `CONTRIBUTING.md`，内容包括：本地开发环境搭建步骤、代码规范（lint/format 命令）、PR 流程说明、Issue 提交说明。

#### Scenario: 贡献者能独立完成首次贡献
- **WHEN** 贡献者阅读 CONTRIBUTING.md 并按步骤操作
- **THEN** 能完成 fork → 本地开发 → lint 通过 → 提交 PR 的完整流程

### Requirement: 包含 CHANGELOG.md 变更记录
仓库根目录 SHALL 包含 `CHANGELOG.md`，格式遵循 [Keep a Changelog](https://keepachangelog.com/) 规范，包含初始发布版本记录。

#### Scenario: 用户查看版本历史
- **WHEN** 用户访问 CHANGELOG.md
- **THEN** 能看到至少一个版本条目，列出主要功能和已修复的 Bug

### Requirement: GitHub Actions CI 自动校验代码质量
仓库 SHALL 包含 `.github/workflows/ci.yml`，在每次 push 和 PR 时自动运行 lint、type-check、unit test 三道检查，使用 `ubuntu-latest` 和 Node.js 20.x。

#### Scenario: PR 触发 CI 检查
- **WHEN** 开发者提交 Pull Request
- **THEN** GitHub Actions 自动运行并在 PR 页面展示 lint、type-check、test 的通过状态

#### Scenario: CI 失败阻止合并
- **WHEN** CI 中任意一项检查失败
- **THEN** PR 页面显示检查失败状态，提醒开发者修复后再合并

### Requirement: 包含 GitHub Issue 和 PR 模板
`.github/` 目录 SHALL 包含 Issue 模板（Bug 报告和功能请求）和 PR 模板，引导贡献者提供必要信息。

#### Scenario: 用户提交 Bug 报告
- **WHEN** 用户在 GitHub 上新建 Issue
- **THEN** 可以选择 Bug Report 模板，填写复现步骤、预期行为、实际行为

#### Scenario: 开发者提交 PR
- **WHEN** 开发者创建 Pull Request
- **THEN** PR 描述框自动填充模板，包含变更说明、测试方式、截图（可选）
