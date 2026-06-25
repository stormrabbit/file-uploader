## 1. 构建编排脚本

- [x] 1.1 新建 `scripts/prepare-resources.js`，引入 Node 内置 `child_process`、`fs`、`path`
- [x] 1.2 脚本开头校验 `../file-uploader-server` 和 `../file-uploader-fe` 目录存在，否则打印含路径的错误信息并 `process.exit(1)`
- [x] 1.3 用 `execSync('npm run build', { cwd: serverDir, stdio: 'inherit' })` 触发 server 构建
- [x] 1.4 用 `execSync('npm run build', { cwd: feDir, stdio: 'inherit', env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:38902/' } })` 触发前端构建
- [x] 1.5 清空并重建 `resources/server/`，用 `fs.cpSync` 依次拷贝 server 的 `dist/`、`node_modules/`、`prisma/`
- [x] 1.6 清空并重建 `resources/web/`，用 `fs.cpSync` 拷贝前端 `dist/`（含 `pages/pc/index.html`）
- [x] 1.7 更新 `package.json` 的 `scripts.build` 为 `node scripts/prepare-resources.js`
- [x] 1.8 在 `.gitignore` 追加 `resources/` 条目

## 2. electron/main.js 重写

- [x] 2.1 在文件顶部引入 `path`、`fs`、`http`、`child_process`（`fork`、`spawnSync`）和 `electron`（`app`、`BrowserWindow`）
- [x] 2.2 定义辅助函数 `getUserDataPath()`：返回 `app.getPath('userData')`（需在 `app.whenReady` 之后调用）
- [x] 2.3 实现 `ensureDir(dir)`：`fs.mkdirSync(dir, { recursive: true })`
- [x] 2.4 实现 `runMigrate(userData)`：用 `spawnSync` 执行 `resources/server/node_modules/.bin/prisma migrate deploy`，注入 `DATABASE_URL=file:${userData}/data.db`，`cwd` 设为 `resources/server/`；返回 `{ success, stderr }`
- [x] 2.5 实现 `checkHealth()`：返回 Promise，用 `http.get` 请求 `http://127.0.0.1:38902/health`，200 resolve，否则 reject
- [x] 2.6 实现 `pollHealth(timeoutMs)`：每 500ms 调用 `checkHealth()`，timeoutMs（30000）内未成功则 reject('timeout')
- [x] 2.7 实现 `loadErrorPage(win, title, detail, logPath)`：读取 `electron/error.html`，替换模板变量（`{{TITLE}}`、`{{DETAIL}}`、`{{LOG_PATH}}`），用 `win.loadURL('data:text/html,...')` 展示
- [x] 2.8 实现 `createWindow()`：创建 1200×800 BrowserWindow（contextIsolation、noNodeIntegration、preload），加载 `electron/loading.html`，返回 win
- [x] 2.9 实现主启动流程 `startApp()`（async）：
  - 获取 `userData`，`ensureDir(userData/logs)`
  - 若 `userData/data.db` 不存在，调用 `runMigrate`；失败时 `loadErrorPage` 并返回
  - `fork('resources/server/dist/main.js', [], { env: {DATA_DIR, DATABASE_URL, PORT=38902, NODE_PATH=resources/server/node_modules, ...process.env}, silent: true })`
  - 子进程 stdout/stderr pipe 到 `fs.createWriteStream(userData/logs/server.log, {flags:'a'})`
  - 监听子进程 `exit` 事件：若在 health 通过前退出，`loadErrorPage` 并标记为失败
  - 调用 `pollHealth(30000)`：成功则 `win.loadFile(resources/web/pages/pc/index.html)`；失败则 `loadErrorPage`
- [x] 2.10 在 `app.whenReady()` 中：`requestSingleInstanceLock()` 失败时 `app.quit()`；成功时调用 `startApp()`
- [x] 2.11 监听 `before-quit`：kill 子进程（若存在）
- [x] 2.12 监听 `window-all-closed`：非 darwin 调用 `app.quit()`

## 3. 错误页模板

- [x] 3.1 新建 `electron/error.html`：包含标题区（`{{TITLE}}`）、详情区（`{{DETAIL}}`）、日志路径区（`{{LOG_PATH}}`）、退出按钮（`onclick="window.close()"`）；纯内联 CSS，无外部依赖

## 4. 验证

- [x] 4.1 执行 `npm run build`，确认 prebuild 触发 check-deps，prepare-resources.js 依次构建 server 和前端，`resources/server/dist/main.js` 与 `resources/web/pages/pc/index.html` 存在
- [x] 4.2 执行 `npm start`，确认 loading 页出现（截图 01-loading.png 验证）
- [x] 4.3 等待约 5s，确认主窗口切换到前端 PC 页面（"简单存储" header 可见，截图 02-frontend.png 验证）
- [x] 4.4 在前端页面选择一个文件并上传，确认上传成功（curl 直接调用 /files/upload，服务端返回 code:200，server.log 中有 /files/upload 记录）
- [x] 4.5 退出应用，确认 server 进程不再占用 38902 端口（lsof -ti :38902 无结果）
- [x] 4.6 模拟错误场景：将 `resources/server/dist/main.js` 临时重命名，启动 app，确认展示错误页含日志路径（截图 06-error-page.png 验证）；恢复文件
- [x] 4.7 尝试二次启动（在已运行的情况下再执行 `npm start`），确认第二个实例立即退出（单实例锁生效，第二进程无窗口即退出）
- [x] 4.8 检查 `${userData}/logs/server.log` 存在且包含 server 启动日志（~/Library/Application Support/file-uploader-desktop/logs/server.log 确认）
