## 1. 添加 LICENSE 文件

- [x] 1.1 在仓库根目录创建 `LICENSE` 文件，内容为 MIT 协议，版权行为 `Copyright (c) 2026 杨`

## 2. 修复 .gitignore

- [x] 2.1 在根目录 `.gitignore` 末尾追加 `memory/` 规则，停止追踪 Claude Code 内部工具目录

## 3. 更新 pubspec.yaml

- [x] 3.1 将 `pubspec.yaml` 的 `description` 字段更新为描述实际功能的文本（例如：`A Flutter Android app for scanning QR codes and uploading photos to a local server.`）

## 4. 重写 README.md

- [x] 4.1 用项目名称、一句话介绍和功能特性列表替换当前默认内容
- [x] 4.2 添加架构说明章节：描述 App + 配套服务端的关系，注明需要自行部署服务端
- [x] 4.3 添加服务端 API 契约章节：列出 `GET /files/isExist/:md5` 和 `POST /files/upload` 的请求/响应结构示例
- [x] 4.4 添加构建与运行章节：列出 Flutter 版本要求、环境准备、`flutter pub get`、`flutter run` 步骤
- [x] 4.5 添加 Android 权限说明：说明 `CAMERA`、`READ_MEDIA_IMAGES` 的用途
- [x] 4.6 添加网络安全说明：解释 `cleartextTrafficPermitted="true"` 是局域网使用场景的有意配置
