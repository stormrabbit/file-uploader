## 1. FilesService — 新增归档方法

- [x] 1.1 在 `files.service.ts` 顶部添加 `fs`、`path`、`dayjs`、`encryptFile2Md5`、`combineFileNameAndSuffix`、`CreateFileDTO` 的 import
- [x] 1.2 在 `FilesService` 中新增 `async archiveUploadedFile(file: Express.Multer.File)` 方法
- [x] 1.3 在方法内实现：计算 MD5（`encryptFile2Md5`）、用 `process.cwd()` 拼接临时文件绝对路径
- [x] 1.4 在方法内实现：按 `static/YYYY-MM-DD/` 和 `static/YYYY-MM-DD/{md5}/` 创建归档目录（不存在时 `fs.mkdirSync`）
- [x] 1.5 在方法内实现：`fs.copyFileSync` 移动文件到归档目录，`fs.unlinkSync` 删除临时文件
- [x] 1.6 在方法内实现：构造 HTTP 相对路径 `fileUrl`（`/static/YYYY-MM-DD/{md5}/{fileName}`）
- [x] 1.7 在方法内实现：查询同名文件数并生成 `nameSuffix` / `nameWithSuffix`（复用现有 `retrievePreciselyFilesByCondition`）
- [x] 1.8 在方法内调用 `this.createFile(fileDto)` 写库并返回结果

## 2. FilesController — 精简 uploadFiles

- [x] 2.1 将 `uploadFiles` 方法体替换为单行：`return this.fileService.archiveUploadedFile(file)`
- [x] 2.2 删除 Controller 中不再使用的 import：`fs`、`path`、`dayjs`、`encryptFile2Md5`、`combineFileNameAndSuffix`、`CreateFileDTO`

## 3. 验证

- [x] 3.1 `npm run build` 编译通过，无 TS 错误
- [x] 3.2 本地启动服务，调用 `POST /files/upload` 上传文件，验证文件归档到正确目录、数据库记录写入成功
- [x] 3.3 上传同名文件，验证 `nameSuffix` 递增、`nameWithSuffix` 正确生成
- [x] 3.4 调用 `GET /files/download?id=` 验证下载链接可用
