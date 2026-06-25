## 1. Bug 修复（优先，先于文档）

- [x] 1.1 修复 `src/utils/delay.ts` `delay()` 函数，将 `setInterval` 改为 `setTimeout`
- [x] 1.2 修复 `src/compostions/size.ts` `window.onresize` 改为 `addEventListener('resize', fn)`，并在 `onUnmounted` 中调用 `removeEventListener`

## 2. 仓库卫生清理

- [x] 2.1 删除根目录 `ScreenShot_*.png` 等截图文件
- [x] 2.2 在 `.gitignore` 中追加 `ScreenShot_*.png` 规则
- [x] 2.3 从 `.gitignore` 中移除 `docs` 行，将 `docs/*.md` 纳入版本控制
- [x] 2.4 通读 `docs/ISSUES.md`、`docs/IMPROVEMENT.md`、`docs/REFACTOR_PLAN.md`，确认无敏感信息后提交
- [x] 2.5 确认 `.env.example` 包含所有 `VITE_*` 环境变量及注释说明，确认 `.env` 在 `.gitignore` 中

## 3. 开源基础文件

- [x] 3.1 重写 `README.md`：项目介绍、功能列表、技术栈、快速上手（`npm install && npm run dev`）、部署指南（Nginx 端口约定）、架构说明，中文为主
- [x] 3.2 创建 `LICENSE` 文件，内容为 MIT License，年份 2026，版权持有人为作者
- [x] 3.3 创建 `CONTRIBUTING.md`：本地开发环境搭建、代码规范（`npm run lint && npm run format`）、PR 流程说明
- [x] 3.4 创建 `CHANGELOG.md`，格式遵循 Keep a Changelog，包含初始版本条目，列出主要功能与已修复 Bug

## 4. GitHub Actions 与社区模板

- [x] 4.1 创建 `.github/workflows/ci.yml`：push 和 PR 时触发，运行 `npm run lint`、`npm run type-check`（`vue-tsc --noEmit`）、`npm run test:unit`，环境 `ubuntu-latest` + Node.js 20.x
- [x] 4.2 创建 `.github/ISSUE_TEMPLATE/bug_report.md`：Bug 报告模板，含复现步骤、预期/实际行为、环境信息
- [x] 4.3 创建 `.github/ISSUE_TEMPLATE/feature_request.md`：功能请求模板，含背景、期望功能描述
- [x] 4.4 创建 `.github/PULL_REQUEST_TEMPLATE.md`：PR 模板，含变更说明、测试方式、截图（可选）

## 5. 验证与发布准备

- [x] 5.1 运行 `npm run lint` 确认无报错
- [x] 5.2 运行 `npm run type-check` 确认无类型错误
- [x] 5.3 运行 `npm run test:unit` 确认所有单测通过
- [x] 5.4 运行 `npm run build` 确认构建成功
- [ ] 5.5 在 GitHub 仓库 Settings 中将仓库设为 Public
