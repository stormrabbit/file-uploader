## Why

本项目是一个局域网文件/照片同步工具（手机端上传、PC 端浏览查看），代码已具备基本功能，但仍处于"私有内部项目"状态：README 为 Vue 模板默认内容、缺少 License、存在已知 Bug、部分代码有安全/质量隐患。现在计划将其开源，需要在发布前做一次系统性整理，确保代码质量、文档完整性和社区协作基础设施达到开源项目标准。

## What Changes

- **README 重写**：替换 Vue 模板默认 README，补充项目介绍、功能截图说明、快速上手、部署指南、架构说明
- **添加 LICENSE**：选择 MIT License，写入 `LICENSE` 文件
- **添加 CONTRIBUTING.md**：贡献指南，含本地开发启动、代码规范、PR 流程
- **添加 CHANGELOG.md**：初始版本变更记录
- **修复已知 Bug（开源前必修）**：
  - `src/services/axios.ts`：修复双重 `.data` 解包（高优先级）
  - `src/utils/delay.ts`：`setInterval` 改为 `setTimeout`
  - `src/compostions/size.ts`：`window.onresize` 改为 `addEventListener` + `onUnmounted`
  - `src/pages/mobile/modules/Dashboard.vue`：`window.confirm` 改为 Vant Dialog
- **清理截图文件**：删除根目录下的 `ScreenShot_*.png` 等临时截图，避免二进制文件污染仓库历史
- **清理 `docs/` gitignore**：`docs` 目录当前在 `.gitignore` 中被忽略，开源后文档应可见，需移除忽略规则并提交现有文档
- **添加 GitHub Actions CI**：在 `.github/workflows/` 下配置 `ci.yml`，包含 lint、type-check、unit test 三道门
- **添加 `.github/` 模板**：`ISSUE_TEMPLATE`（Bug 报告 / 功能请求）和 `PULL_REQUEST_TEMPLATE`
- **修复目录拼写错误**（可选/渐进）：`src/compostions/` → `src/composables/`（需全局替换引用）
- **`download.ts` 改用 ApiService**：移除 baseURL 硬编码（低优先级，但影响代码示例质量）

## Capabilities

### New Capabilities

- `open-source-infra`: 开源基础设施，包括 README、LICENSE、CONTRIBUTING、CHANGELOG、GitHub Actions CI、Issue/PR 模板
- `bug-fixes`: 修复开源前必须解决的已知 Bug（双重解包、onresize 覆盖、confirm 弹窗、delay 实现）
- `repo-hygiene`: 仓库卫生整理，包括清理截图文件、修正 docs gitignore、消除硬编码等

### Modified Capabilities

- `dynamic-api-base-url`: `download.ts` 改用 ApiService，消除绕过拦截器的 hardcoded baseURL

## Impact

- **文件变更**：`README.md`（重写）、`LICENSE`（新增）、`CONTRIBUTING.md`（新增）、`CHANGELOG.md`（新增）、`.github/`（新增目录）、`.gitignore`（移除 `docs`）
- **Bug 修复涉及文件**：`src/services/axios.ts`、`src/utils/delay.ts`、`src/compostions/size.ts`、`src/pages/mobile/modules/Dashboard.vue`、`src/utils/download.ts`
- **无破坏性变更**：所有修改均向后兼容，不影响运行时 API 或路由结构
- **构建/测试**：CI 配置新增，本地开发命令不变
