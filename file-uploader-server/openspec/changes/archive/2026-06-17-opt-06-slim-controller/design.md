## Context

当前 `FilesController.uploadFiles`（`files.controller.ts:43-92`）直接操作文件系统：计算 MD5、按日期创建目录、移动临时文件、查询同名文件并生成带后缀的文件名，最终调用 `FilesService.createFile` 写库。`FilesService` 目前仅做 Prisma CRUD，不包含任何文件系统逻辑。

重构目标是使 Controller 回归 HTTP 层职责，让 Service 持有完整的"文件归档"业务逻辑。

## Goals / Non-Goals

**Goals:**
- 将文件归档逻辑（MD5、目录、移动、重名）从 Controller 迁移到 `FilesService.archiveUploadedFile`
- Controller 的 `uploadFiles` 精简为三行：接收文件 → 调用 service → 返回结果
- 行为与当前完全一致（路由、请求/响应格式不变）

**Non-Goals:**
- 不改变 API 契约（路径、HTTP 方法、字段名）
- 不改变数据库 schema 或 Prisma model
- 不修改 multer 配置或临时目录策略
- 不处理其他 OPT 项（鉴权、UsersService 等）

## Decisions

### 1. 新方法命名：`archiveUploadedFile(file: Express.Multer.File)`

将完整归档流程封装为单一 Service 方法，入参与 multer 解析后的文件对象对齐，出参为 Prisma 返回的文件记录。

**备选方案**：拆成多个私有辅助方法（`computeMd5`、`ensureDir`、`moveFile` 等）。但对于当前规模，单一方法已足够清晰，过度拆分反而增加阅读成本。

### 2. 文件系统依赖留在 Service，不抽象为接口

当前项目无测试覆盖，抽象存储接口（`IStorageAdapter`）会引入不必要复杂度。直接在 Service 内使用 `fs`/`path` 即可；未来若需替换存储后端可再提取。

### 3. `CreateFileDTO` 保持不变，在 Service 内部构造

Service 方法内部 `new CreateFileDTO()` 并填充字段，不对外暴露中间状态。Controller 无需感知 DTO 细节。

## Risks / Trade-offs

- **[风险] import 转移引入遗漏** → Service 新增 `fs`、`path`、`dayjs`、`encryptFile2Md5`、`combineFileNameAndSuffix` 的 import；Controller 同步移除，编译期即可发现遗漏。
- **[风险] `__dirname` 路径在 Service 中与 Controller 不同** → 当前 Controller 用 `path.join(__dirname, '../../../static/...')`，`__dirname` 指向编译后的 `dist/domain/files/`，层级相同；迁移到 Service 后 `__dirname` 仍指向同级目录，路径不变，无影响。实际上可改为 `process.cwd()` 更明确，本次一并修正。

## Migration Plan

纯代码重构，无数据迁移、无部署顺序约束：

1. 在 `FilesService` 新增 `archiveUploadedFile` 方法，包含原 Controller 中的全部归档逻辑。
2. 简化 `FilesController.uploadFiles`，删除归档代码，改为调用新方法。
3. 清理 Controller 中不再使用的 import（`fs`、`path`、`dayjs` 等）。
4. 本地启动验证上传接口行为不变。

回滚：git revert 即可，无副作用。
