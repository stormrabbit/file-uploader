## ADDED Requirements

### Requirement: 服务通过环境变量声明数据根目录
系统 SHALL 在启动时读取 `process.env.DATA_DIR` 作为持久化数据（上传目录、未来其他状态文件等）的根路径。当环境变量未设置或为空字符串时，SHALL 回退至 `process.cwd()`，以保证开发模式 `npm run start:dev` 与独立部署零回归。

#### Scenario: 环境变量未设置时使用默认值
- **WHEN** 启动服务时未传入 `DATA_DIR`
- **THEN** 系统 SHALL 使用 `process.cwd()` 作为数据根目录

#### Scenario: 环境变量为绝对路径
- **WHEN** 启动服务时设置 `DATA_DIR=/Users/foo/Library/Application Support/FileUploader`
- **THEN** 系统 SHALL 使用该绝对路径作为根目录

#### Scenario: 环境变量为相对路径
- **WHEN** 启动服务时设置 `DATA_DIR=./tmp/data`
- **THEN** 系统 SHALL 相对当前工作目录解析该路径

#### Scenario: 路径包含空格
- **WHEN** 启动服务时设置 `DATA_DIR=/Users/foo/Library/Application Support/FileUploader`（包含空格）
- **THEN** 系统 SHALL 正确处理路径，不因空格分割

### Requirement: 提供集中式运行时路径解析模块
系统 SHALL 提供 `src/config/runtime-paths.ts` 模块，导出至少以下两个纯函数：
- `getDataDir(): string` — 返回数据根目录绝对路径
- `getStaticDir(): string` — 返回上传归档根目录，等价于 `path.join(getDataDir(), 'static')`

所有需要持久化路径的模块 MUST 通过该模块获取路径，不得在业务代码中直接读取 `process.env.DATA_DIR` 或拼接 `'static'` 字面量。

#### Scenario: FilesService 通过模块获取归档根路径
- **WHEN** `FilesService.archiveUploadedFile` 计算归档目标路径
- **THEN** 系统 SHALL 调用 `getStaticDir()` 获取根路径，再拼接 `YYYY-MM-DD/{md5}/` 子目录

#### Scenario: main.ts 静态映射使用模块
- **WHEN** NestJS 注册 `express.static` 中间件
- **THEN** 系统 SHALL 通过 `getStaticDir()` 取得静态资源根，不得硬编码 `./static`

#### Scenario: 业务代码不直接读 DATA_DIR
- **WHEN** 在 `src/domain/` 下搜索 `process.env.DATA_DIR`
- **THEN** SHALL 无任何匹配（仅 `src/config/runtime-paths.ts` 内部读取）

### Requirement: SQLite 文件位置通过 DATABASE_URL 控制
`prisma/schema.prisma` 的 `datasource.url` MUST 保持声明为 `env("DATABASE_URL")`，不得硬编码具体路径。运行时 `DATABASE_URL` 由进程启动方提供。

#### Scenario: 外部进程注入 DATABASE_URL
- **WHEN** 启动 server 时设置 `DATABASE_URL=file:/Users/foo/Library/Application Support/FileUploader/data.db`
- **THEN** Prisma Client SHALL 连接到该绝对路径下的 SQLite 文件

#### Scenario: 开发模式从 .env 加载
- **WHEN** 开发模式启动且项目根目录存在 `.env` 文件包含 `DATABASE_URL=file:./data.db`
- **THEN** 系统 SHALL 加载该 .env 并使用项目根目录下的 `data.db`，行为与改造前一致

### Requirement: Prisma schema 声明多平台二进制目标
`prisma/schema.prisma` 的 `generator client` 块 SHALL 包含 `binaryTargets = ["native", "darwin", "darwin-arm64", "windows"]`，使 `prisma generate` 一次产出当前平台 + mac (Intel + Apple Silicon) + windows 平台的 query engine，供 Electron 跨平台打包使用。

#### Scenario: prisma generate 产出多平台 engine
- **WHEN** 在 mac 上执行 `npx prisma generate`
- **THEN** `node_modules/.prisma/client/` 下 SHALL 同时存在 darwin、darwin-arm64、windows 三平台的 query engine 二进制

#### Scenario: 开发者本机 engine 仍可用
- **WHEN** 在任意支持的平台（包括 Linux）执行 `prisma generate` 后启动服务
- **THEN** Prisma Client SHALL 加载 `native` 平台的 engine 正常运行
