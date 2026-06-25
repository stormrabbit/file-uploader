## Why

该项目是一个 Flutter Android 应用，具备完整的扫码连接、WebView 嵌入和原生照片上传功能，具备对外开源的技术条件。但当前缺少 LICENSE、README 内容为脚手架默认模板、内部工具目录被 git 追踪、`pubspec.yaml` 描述未更新，导致外部开发者无法理解项目用途，也无法合法使用代码。

## What Changes

- 新增 `LICENSE` 文件（MIT 协议）
- 重写 `README.md`，涵盖项目介绍、架构说明、服务端 API 契约、构建与运行步骤
- 将 `memory/` 目录加入 `.gitignore`，停止追踪 Claude Code 内部工具文件
- 更新 `pubspec.yaml` 的 `name`、`description` 字段为实际内容
- 在 README 中说明 `network_security_config.xml` 全局允许 HTTP 是内网使用的有意设计

## Capabilities

### New Capabilities

- `open-source-meta`: 项目元数据与文档，包括 LICENSE、README、.gitignore 修正和 pubspec 描述，使项目满足开源发布标准

### Modified Capabilities

<!-- 无现有 spec 的行为变更 -->

## Impact

- 新增文件：`LICENSE`
- 修改文件：`README.md`、`pubspec.yaml`、`.gitignore`
- 不涉及任何 Dart/Kotlin 代码变更，不影响运行时行为
- `memory/` 目录内容不会出现在公开仓库，但本地文件保留
