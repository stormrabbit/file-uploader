## Context

`file-uploader-fe` 是一个局域网文件/照片同步前端，采用 Vue 3 + TypeScript + Vite MPA 架构，分为 PC 端和 Mobile 端。代码已具备核心功能，但当前处于"内部私有"状态：README 是 Vue 官方模板默认内容、没有 LICENSE、有若干已知 Bug 未修复、`docs/` 目录被 `.gitignore` 忽略导致文档不可见、根目录存在截图文件污染历史。现在计划将该仓库开源，需要在合并前完成一次系统性整理。

**关键约束：**
- 不破坏现有功能或 API 结构
- Bug 修复优先于文档工作（开源代码应先跑通）
- `compostions/` 目录名拼写错误的重命名为渐进可选项（影响所有 import 路径，需谨慎）

## Goals / Non-Goals

**Goals:**
- 完善开源基础设施：README、LICENSE（MIT）、CONTRIBUTING、CHANGELOG
- 添加 GitHub Actions CI（lint + type-check + unit test）
- 添加 GitHub Issue / PR 模板，降低社区协作门槛
- 修复开源前必须解决的 4 个已知 Bug
- 清理仓库卫生（截图文件、docs gitignore）
- 修复 `download.ts` hardcoded baseURL（消除开源代码中的不良示例）

**Non-Goals:**
- 重构 `commonUploader` 复用 `useUpload`（中期项，本次不纳入）
- PC 端虚拟滚动或分页（中期优化）
- `compostions/` 目录重命名（风险高、收益低，另立任务处理）
- 后端 API 接口的任何变更
- VitePress 文档站或 npm 包发布

## Decisions

### D1：LICENSE 选择 MIT

**决策**：采用 MIT License。  
**理由**：工具类项目，宽松许可证降低使用门槛，适合局域网工具场景下的个人/小团队使用。Apache 2.0 对于此规模项目过重。  
**替代方案**：AGPL（防止云服务商闭源使用），但局域网工具场景下此风险不存在。

### D2：CI 仅覆盖 lint + type-check + unit test，不含 E2E

**决策**：GitHub Actions `ci.yml` 运行 `npm run lint`、`npm run type-check`（即 `vue-tsc --noEmit`）、`npm run test:unit`，不含 Playwright/Cypress E2E。  
**理由**：项目目前无 E2E 测试配置，强行引入 E2E 会增加维护成本。三道门足以保证代码质量信号。  
**触发条件**：push 和 PR 均触发，使用 `ubuntu-latest` + `node 20.x`。

### D3：docs/ 从 .gitignore 中移除

**决策**：删除 `.gitignore` 中的 `docs` 行，将 `docs/ISSUES.md`、`docs/IMPROVEMENT.md`、`docs/REFACTOR_PLAN.md` 纳入版本控制。  
**理由**：这些文档对贡献者有价值，不应被 git 忽略。`docs/` 下没有需要排除的构建产物。

### D4：Bug 修复的顺序与隔离

**决策**：四个 Bug 修复按以下顺序独立提交，互不耦合：
1. `axios.ts` 双重 `.data` 解包（最高优先级，影响所有 API 调用）
2. `delay.ts` `setInterval` 改 `setTimeout`（逻辑 Bug，影响上传流程）
3. `size.ts` `window.onresize` 改 `addEventListener`（内存泄漏，影响所有页面）
4. `Dashboard.vue` `window.confirm` 改 Vant Dialog（UX Bug）

**理由**：独立修复便于 code review 和 blame 追溯，回滚时不互相影响。

### D5：根目录截图文件处理

**决策**：删除 `ScreenShot_*.png` 等临时截图文件，并在 `.gitignore` 中追加 `ScreenShot_*.png` 防止再次提交。不使用 `git filter-branch` 重写历史（开源前历史不敏感，复杂度不值得）。  
**理由**：二进制截图增加 clone 体积，与项目无关。

### D6：download.ts 改用 ApiService

**决策**：`src/utils/download.ts` 改用 `ApiService` 实例发起请求，不再直接 import 裸 axios。`baseURL` 通过 `getApiBaseUrl()` 动态获取，与其他 API 模块一致。  
**理由**：开源代码中 hardcoded baseURL 是不良示例，也绕过了拦截器（无统一错误处理）。

## Risks / Trade-offs

- **[Risk] axios.ts 双重 `.data` 解包修复后，所有调用方的返回类型会变化** → 修复后需全量回归测试，确认 PC 端和 Mobile 端列表、上传、删除等功能正常。TypeScript 类型检查会暴露大部分问题。
- **[Risk] size.ts 修复引入 `onUnmounted`，若有组件在 setup 外调用该 composable** → 检查所有调用方均在 setup 内；若有 Options API 调用则需特殊处理。
- **[Trade-off] docs 纳入 git 后，内容中可能包含内部讨论细节** → 在纳入版本控制前，通读 `docs/*.md`，确认无敏感信息（IP、密码、个人信息）。

## Migration Plan

1. 按 D4 顺序逐一合并 Bug 修复 PR
2. 提交文档（README、LICENSE、CONTRIBUTING、CHANGELOG）
3. 提交 `.github/` 目录（CI + 模板）
4. 清理仓库卫生（截图删除、docs gitignore 移除）
5. 修复 `download.ts`
6. 在 GitHub 上将仓库设为 Public

无需数据库迁移或服务端变更，纯前端修改，无 rollback 复杂度。

## Open Questions

- `compostions/` 目录重命名是否在本次开源前处理？（当前决策：延后，另立任务）
- README 是否需要中英双语？（推荐：主语言中文 + 英文摘要）
