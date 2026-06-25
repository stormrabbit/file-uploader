## Context

该项目目前是一个私有 Flutter 仓库，无 LICENSE、README 为脚手架默认内容、`memory/` 内部工具目录被 git 追踪、`pubspec.yaml` 描述未更新。所有变更均为纯文档与配置层面，不涉及 Dart/Kotlin 源代码修改。

## Goals / Non-Goals

**Goals:**
- 新增 MIT LICENSE，赋予外部贡献者明确的法律使用权限
- 重写 README，覆盖项目功能、架构、服务端 API 契约、构建与运行步骤
- 将 `memory/` 加入 `.gitignore`，停止追踪 Claude Code 内部工具文件
- 更新 `pubspec.yaml` 的 `description` 字段
- 在 README 中说明 HTTP 明文流量配置的内网使用背景

**Non-Goals:**
- 不修改任何运行时代码（Dart/Kotlin/Gradle）
- 不添加 CI/CD 配置或自动发布流程
- 不编写单元测试或 Widget 测试
- 不修改 Application ID、签名配置等 Android 发布设置

## Decisions

**使用 MIT License**
理由：宽松协议，适合个人开源工具类项目，最大限度降低使用门槛。Apache-2.0 需要 NOTICE 文件，过于复杂；GPL 限制过多。

**README 语言：中英双语**
理由：项目 UI 为中文，目标用户以中文开发者为主，但代码注释和 API 示例用英文更利于国际化搜索索引。采用中文主体 + 英文 API 代码块的混合方式。

**仅 `.gitignore` 处理 `memory/`，不删除现有文件**
理由：`memory/` 是 Claude Code 的本地上下文文件，对项目功能无影响，加入 `.gitignore` 即可阻止后续提交，无需清洗历史（rewrite history 代价大，当前仓库未公开，风险低）。

**`pubspec.yaml` 仅更新 `description`，不改 `name`**
理由：`name: file_uploader_app` 是 package 标识符，已被 Android Manifest 和 import 引用，随意修改会引发编译错误；`description` 字段仅用于文档展示，安全修改。

## Risks / Trade-offs

- **README 描述服务端 API**：服务端实现未开源，文档中需明确说明 App 依赖配套服务端，API 契约由 App 侧定义。→ 在 README 中显式注明"需要配套服务端"。
- **HTTP 明文流量说明**：`cleartextTrafficPermitted="true"` 对安全审查者是警示信号。→ README 中专门说明这是局域网使用场景的有意配置。
- **`memory/` 历史提交仍可见**：仅加 `.gitignore` 不清洗历史，已提交的内容在 git log 中仍可查。→ `memory/` 内容无敏感信息（仅项目摘要），当前风险可接受。
