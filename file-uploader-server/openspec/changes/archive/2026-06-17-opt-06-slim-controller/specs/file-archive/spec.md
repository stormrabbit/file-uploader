## ADDED Requirements

### Requirement: FilesService 负责文件归档
`FilesService` SHALL 提供 `archiveUploadedFile(file: Express.Multer.File)` 方法，将 multer 临时文件归档到持久化目录并写入数据库，返回已持久化的文件记录。Controller 不得包含任何文件系统操作或路径拼接逻辑。

#### Scenario: 正常上传新文件
- **WHEN** 调用 `archiveUploadedFile`，传入有效的 multer 文件对象
- **THEN** 系统 SHALL 计算文件 MD5，在 `static/YYYY-MM-DD/{md5}/` 目录下归档文件，删除临时文件，并将文件记录写入数据库后返回

#### Scenario: 同名文件自动附加序号后缀
- **WHEN** 数据库中已存在同 `fileName` 的记录
- **THEN** 系统 SHALL 将 `nameSuffix` 设为当前同名记录数量（字符串形式），`nameWithSuffix` 通过 `combineFileNameAndSuffix` 生成

#### Scenario: 首次上传该文件名
- **WHEN** 数据库中不存在同 `fileName` 的记录
- **THEN** 系统 SHALL 将 `nameSuffix` 设为空字符串，`nameWithSuffix` 等于原始文件名

#### Scenario: 按日期归档目录不存在时自动创建
- **WHEN** `static/YYYY-MM-DD/` 或其 MD5 子目录在磁盘上不存在
- **THEN** 系统 SHALL 自动递归创建所需目录后再移动文件

### Requirement: FilesController.uploadFiles 仅含 HTTP 层逻辑
`FilesController.uploadFiles` SHALL 只负责接收 multer 解析的文件，调用 `FilesService.archiveUploadedFile`，并返回其结果，不得直接操作文件系统或引入 `fs`/`path`/`dayjs`/`encryptFile2Md5`/`combineFileNameAndSuffix` 等非 HTTP 依赖。

#### Scenario: 上传请求成功
- **WHEN** `POST /files/upload` 收到合法的 multipart 文件
- **THEN** Controller SHALL 将文件对象传给 Service 并将 Service 返回值直接作为响应体返回

#### Scenario: API 契约不变
- **WHEN** 客户端使用现有上传请求格式调用接口
- **THEN** 响应结构（字段名、HTTP 状态码）SHALL 与重构前完全一致
