## ADDED Requirements

### Requirement: 应用强制单实例运行
主进程 SHALL 在 `app.whenReady()` 之前调用 `app.requestSingleInstanceLock()`；若锁获取失败（已有实例在运行），SHALL 立即调用 `app.quit()` 退出当前进程，不再创建窗口或 fork server。

#### Scenario: 第二次启动时直接退出
- **WHEN** 已有一个 FileUploader 实例在运行时，用户再次双击或执行 `npm start`
- **THEN** 第二个进程 SHALL 在获取单实例锁失败后立即退出，不创建新窗口，不 fork server

#### Scenario: 正常启动时锁被持有
- **WHEN** 没有其他实例运行时执行 `npm start`
- **THEN** 应用 SHALL 正常启动并持有单实例锁直到进程退出

### Requirement: 首次启动时执行数据库迁移
主进程 SHALL 在 fork server 之前检测 `${userData}/data.db` 是否存在；若不存在，SHALL 同步执行 `prisma migrate deploy`（使用 `resources/server/` 下的 prisma CLI 与 migration 文件），环境变量注入 `DATABASE_URL=file:${userData}/data.db`。迁移失败时 SHALL 展示错误页并中止启动流程（不 fork server）。

#### Scenario: 首次启动建表
- **WHEN** `${userData}/data.db` 不存在时启动应用
- **THEN** 主进程 SHALL 执行 prisma migrate deploy，执行完成后 `${userData}/data.db` SHALL 存在

#### Scenario: 非首次启动跳过迁移
- **WHEN** `${userData}/data.db` 已存在时启动应用
- **THEN** 主进程 SHALL NOT 执行 prisma migrate deploy，直接进入 fork server 阶段

#### Scenario: 迁移失败展示错误页
- **WHEN** prisma migrate deploy 以非零退出码退出
- **THEN** 主进程 SHALL 不 fork server，窗口 SHALL 展示包含错误信息和日志路径的错误页

### Requirement: fork NestJS server 子进程并注入运行时环境
主进程 SHALL 通过 `child_process.fork('resources/server/dist/main.js', [], { env, execPath })` 启动 server 子进程，注入以下环境变量：`DATA_DIR=${userData}`、`DATABASE_URL=file:${userData}/data.db`、`PORT=38902`；`NODE_PATH` 指向 `resources/server/node_modules`。子进程的 stdout 与 stderr SHALL 重定向写入 `${userData}/logs/server.log`（追加模式）。

#### Scenario: server 子进程被 fork
- **WHEN** 应用正常启动（data.db 已存在或迁移成功）
- **THEN** 主进程 SHALL fork `resources/server/dist/main.js`，子进程 PID SHALL 可观察（主进程持有引用）

#### Scenario: 子进程日志写入文件
- **WHEN** server 子进程输出任何 stdout/stderr
- **THEN** 输出 SHALL 追加写入 `${userData}/logs/server.log`，不输出到主进程 terminal

#### Scenario: 子进程收到正确环境变量
- **WHEN** 子进程启动后请求 `GET /health`
- **THEN** server SHALL 响应 200（证明以正确 env 启动并完成 listen）

### Requirement: 轮询 /health 后切换到前端页面
主进程 SHALL 在 fork server 后以 500ms 间隔轮询 `GET http://127.0.0.1:38902/health`；收到 HTTP 200 响应后 SHALL 调用 `win.loadFile(path.join(__dirname, '..', 'resources', 'web', 'pages', 'pc', 'index.html'))` 切换到前端页面。

#### Scenario: health 轮询成功后切换页面
- **WHEN** server 子进程启动并完成 listen，主进程轮询到 200 响应
- **THEN** 主窗口 SHALL 切换加载 `resources/web/pages/pc/index.html`，用户可看到前端 PC 页面

#### Scenario: 前端页面加载后可完成文件上传
- **WHEN** 前端页面加载完成，用户选择文件并点击上传
- **THEN** 前端 SHALL 向 `http://127.0.0.1:38902/` 发起请求，server 处理并返回成功响应

### Requirement: 30 秒超时或子进程异常退出时展示错误页
主进程 SHALL 在 fork server 后启动 30s 计时器；若超时前未收到 health 200，或子进程以非零退出码退出，SHALL 停止轮询并在主窗口加载错误页，错误页 SHALL 包含：错误原因描述、日志文件完整路径、"quit"按钮（调用 `app.quit()`）。

#### Scenario: 30s 超时展示错误页
- **WHEN** server 子进程 fork 后 30s 内 health 端点始终未返回 200
- **THEN** 主窗口 SHALL 展示错误页，错误页 SHALL 包含 `${userData}/logs/server.log` 的完整路径

#### Scenario: 子进程异常退出展示错误页
- **WHEN** server 子进程在健康检查通过前以非零退出码退出
- **THEN** 主进程 SHALL 停止轮询，主窗口 SHALL 展示包含退出码和日志路径的错误页

### Requirement: 应用退出时 kill server 子进程
主进程 SHALL 监听 `app.on('before-quit')` 事件；收到事件时 SHALL 向子进程发送 SIGTERM（或 `child.kill()`），等待子进程退出后再继续退出流程。

#### Scenario: 正常退出时子进程被 kill
- **WHEN** 用户通过菜单或快捷键退出应用
- **THEN** 主进程 SHALL kill server 子进程，不留孤儿进程；server 端口 38902 SHALL 在应用退出后被释放
