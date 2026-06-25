## Why

`FilesController.uploadFiles` 承担了大量文件归档业务逻辑（MD5 计算、目录创建、文件移动、重名处理），导致 Controller 臃肿、逻辑难以复用和测试。按照 NestJS 分层规范，Controller 应只负责 HTTP 入参解析与结果返回，业务逻辑应下沉至 Service。

## What Changes

- 将 `uploadFiles` 中的以下逻辑从 Controller 迁移至 `FilesService` 的新方法 `archiveUploadedFile`：
  - 计算文件 MD5（`encryptFile2Md5`）
  - 按日期自动创建归档目录（`static/YYYY-MM-DD/`）
  - 按 MD5 创建子目录
  - 将 multer 临时文件移动至归档目录并删除临时文件
  - 构造 HTTP 可访问的相对 `fileUrl`
  - 查询同名文件数量并生成 `nameSuffix` / `nameWithSuffix`
- `FilesController.uploadFiles` 精简为：接收 `Express.Multer.File` → 调用 `FilesService.archiveUploadedFile` → 返回结果，不含任何文件系统操作或日期处理。
- `CreateFileDTO` 保持不变；新方法入参为 `Express.Multer.File`，出参为已持久化的文件记录。

## Capabilities

### New Capabilities

- 无（纯重构，不新增对外能力）

### Modified Capabilities

- 无（API 契约不变，仅内部实现层分离）

## Impact

- **修改文件**：`src/domain/files/files.controller.ts`、`src/domain/files/files.service.ts`
- **不影响**：API 路由、请求/响应结构、数据库 schema、multer 配置
- **副作用**：`fs`、`path`、`dayjs`、`encryptFile2Md5`、`combineFileNameAndSuffix` 的 import 从 Controller 转移到 Service
