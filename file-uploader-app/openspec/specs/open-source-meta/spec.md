## Purpose

确保仓库满足开源发布的基本要求：包含协议文件、可读的 README、干净的 git 历史（不含内部工具文件）、以及有意义的项目元数据。

---

## Requirements

### Requirement: 项目包含有效的开源协议文件
仓库根目录 SHALL 包含 `LICENSE` 文件，内容为标准 MIT 协议，版权年份为 2026，版权人为项目作者。

#### Scenario: LICENSE 文件存在且格式正确
- **WHEN** 用户访问仓库根目录
- **THEN** 存在名为 `LICENSE` 的文件，包含完整的 MIT 协议文本，版权行格式为 `Copyright (c) 2026 <Author>`

---

### Requirement: README 描述项目功能与架构
`README.md` SHALL 包含：项目名称与一句话介绍、核心功能列表、架构说明（App + 服务端关系）、服务端 API 契约（请求/响应格式）、Android 构建与运行步骤、权限说明、HTTP 明文流量配置说明。

#### Scenario: 新用户能理解项目用途
- **WHEN** 用户打开 README
- **THEN** 能在前 3 段内理解：这是一个 Flutter Android App，通过扫码连接 PC 上传照片，依赖配套服务端

#### Scenario: 开发者能找到服务端 API 契约
- **WHEN** 用户查阅 README 中的服务端 API 部分
- **THEN** 能看到 `GET /files/isExist/:md5` 和 `POST /files/upload` 的请求/响应结构示例

#### Scenario: 开发者能找到构建步骤
- **WHEN** 用户查阅 README 的构建章节
- **THEN** 能看到 Flutter 版本要求、`flutter pub get` 和 `flutter run` 命令示例

---

### Requirement: memory/ 目录不被 git 追踪
`.gitignore` SHALL 包含 `memory/` 规则，防止 Claude Code 内部工具文件出现在公开仓库。

#### Scenario: memory/ 新文件不被提交
- **WHEN** 开发者在 `memory/` 下新建文件后执行 `git status`
- **THEN** 该文件出现在 untracked 列表，而非 staged 区域

---

### Requirement: pubspec.yaml 包含有意义的 description
`pubspec.yaml` 的 `description` 字段 SHALL 不为默认的 `"A new Flutter project."`，应描述实际功能。

#### Scenario: description 反映项目用途
- **WHEN** 用户打开 `pubspec.yaml`
- **THEN** `description` 字段内容描述了扫码上传照片的核心功能，长度在 10–80 字之间
