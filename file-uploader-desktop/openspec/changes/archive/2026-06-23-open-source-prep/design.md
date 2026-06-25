## Context

`file-uploader-desktop` 是一个将 NestJS 后端与 Vue 3 前端打包为单体 Electron 桌面应用的宿主工程。当前以私有项目形式开发，现有的 README 仍停留在 P3 阶段描述（骨架阶段），而代码实际上已完成 P5（可打包 DMG）。仓库缺少 LICENSE、CONTRIBUTING、完整构建文档，`.gitignore` 未排除本地 AI 助手和 IDE 专用目录。

约束：
- 项目是三仓库架构：`file-uploader-server`（NestJS）、`file-uploader-fe`（Vue 3）、`file-uploader-desktop`（本仓库），三者必须作为兄弟目录共存才能完成构建
- 应用无内置鉴权，仅适合单机/可信局域网场景
- 代码本身不做功能改动，本次变更仅涉及文档与配置文件

## Goals / Non-Goals

**Goals:**
- 补全合法开源所需的最小文件集（LICENSE、CONTRIBUTING、完整 README）
- 让新用户通过 README 能独立完成从克隆到运行的全流程
- 清理不应入库的本地配置文件（`.gitignore`）
- 让 `package.json` 携带标准 OSS 元数据，使 GitHub 仓库页面展示完整

**Non-Goals:**
- 不修改任何功能代码
- 不引入 CI/CD 工作流（可作为后续独立变更）
- 不删除 `openspec/` 目录内容（仅在 README 中说明其用途）
- 不处理 Windows 打包文档（留待 P6 阶段）
- 不为前端或后端兄弟仓库做任何改动

## Decisions

**D1：LICENSE 选 MIT**
MIT 是个人工具类开源项目最常见的选择，无专利条款限制，使用者可自由集成到商业或非商业项目中。项目不涉及专利敏感技术，MIT 最符合"随便用"的意图。备选 Apache-2.0 在专利豁免上更严格但对个人项目过重。

**D2：README 重写而非追加**
现有 README 内容陈旧（P3 描述）且结构与开源受众不匹配。追加会造成信息混乱，全量重写更清晰。保留 `docs/electron-packaging.md` 作为设计决策存档，README 中以链接形式引用。

**D3：安全警告置于 README 顶部显眼位置**
项目无鉴权，直接暴露公网有安全风险。警告应在第一屏可见，而非藏在 docs 子文档里。使用 `> ⚠️ **安全提示**` blockquote 样式，视觉突出但不破坏文档结构。

**D4：CONTRIBUTING.md 重点说明多仓库依赖**
三仓库架构是最大的新贡献者门槛。CONTRIBUTING.md 首节直接给出目录树示例，并说明 `npm run build` 依赖兄弟仓库存在的原因。

**D5：`package.json` 保留 `"private": true`**
虽然开源项目通常移除此字段，但该字段防止意外执行 `npm publish`（该项目不应发布到 npm 注册表）。保留更安全。

**D6：`.gitignore` 只追加，不修改已有规则**
现有规则（`node_modules/`、`dist/`、`resources/` 等）均正确，只需追加 `.claude/`、`.windsurf/`，以及 `*.log` 兜底规则。避免改动已有行降低 diff 噪声。

## Risks / Trade-offs

- [README 多语言] 当前仓库 commit message 和 docs 均为中文，README 用中文符合现状，但降低国际受众可发现性 → 接受，后续可按需补充英文版
- [openspec/ 目录] 保留 `openspec/` 可能让不熟悉该工具链的贡献者困惑 → 在 README 或 CONTRIBUTING 中一句话说明其用途即可
- [三仓库依赖] 仅文档说明，未通过 git submodule 或 monorepo 解决根本问题 → 文档是最低侵入方案，结构重组留作独立变更
