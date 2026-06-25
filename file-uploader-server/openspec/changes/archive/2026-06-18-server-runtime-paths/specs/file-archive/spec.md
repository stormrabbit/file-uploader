## MODIFIED Requirements

### Requirement: FilesService 负责文件归档
`FilesService` SHALL 提供 `archiveUploadedFile(file: Express.Multer.File)` 方法，将 multer 临时文件归档到持久化目录并写入数据库，返回已持久化的文件记录。Controller 不得包含任何文件系统操作或路径拼接逻辑。归档根目录 SHALL 通过运行时路径模块（`getStaticDir()`）解析，不得硬编码字面量 `static/`，使数据存储位置可在打包后被外部进程通过 `DATA_DIR` 环境变量重定向。

#### Scenario: 正常上传新文件
- **WHEN** 调用 `archiveUploadedFile`，传入有效的 multer 文件对象
- **THEN** 系统 SHALL 计算文件 MD5，在 `${getStaticDir()}/YYYY-MM-DD/{md5}/` 目录下归档文件，删除临时文件，并将文件记录写入数据库后返回

#### Scenario: 同名文件自动附加序号后缀
- **WHEN** 数据库中已存在同 `fileName` 的记录
- **THEN** 系统 SHALL 将 `nameSuffix` 设为当前同名记录数量（字符串形式），`nameWithSuffix` 通过 `combineFileNameAndSuffix` 生成

#### Scenario: 首次上传该文件名
- **WHEN** 数据库中不存在同 `fileName` 的记录
- **THEN** 系统 SHALL 将 `nameSuffix` 设为空字符串，`nameWithSuffix` 等于原始文件名

#### Scenario: 按日期归档目录不存在时自动创建
- **WHEN** `${getStaticDir()}/YYYY-MM-DD/` 或其 MD5 子目录在磁盘上不存在
- **THEN** 系统 SHALL 自动递归创建所需目录后再移动文件

#### Scenario: DATA_DIR 注入后归档到外部目录
- **WHEN** 进程环境变量 `DATA_DIR=/Users/foo/Library/Application Support/FileUploader`
- **THEN** 归档目标 SHALL 为 `/Users/foo/Library/Application Support/FileUploader/static/YYYY-MM-DD/{md5}/`

#### Scenario: 默认行为保持开发模式不变
- **WHEN** 进程环境变量 `DATA_DIR` 未设置
- **THEN** 归档目标 SHALL 退化为相对当前工作目录的 `./static/YYYY-MM-DD/{md5}/`，与改造前行为一致
