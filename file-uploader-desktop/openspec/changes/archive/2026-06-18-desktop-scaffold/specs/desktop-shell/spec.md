## ADDED Requirements

### Requirement: Electron 主进程入口存在且可被启动
系统 SHALL 在 `package.json.main` 字段指定的入口文件（约定为 `electron/main.js`）中创建并展示一个 `BrowserWindow`。`npm start` 命令 SHALL 通过 `electron .` 启动该入口，且在 macOS 上能正常打开窗口、不抛出未捕获异常。

#### Scenario: npm start 启动后窗口出现
- **WHEN** 在仓库根目录执行 `npm start`
- **THEN** Electron 进程 SHALL 启动并创建至少一个 `BrowserWindow`，且该窗口在 5 秒内可见

#### Scenario: 主进程入口可被 require 解析
- **WHEN** 检查 `package.json` 的 `main` 字段
- **THEN** 该字段 SHALL 指向仓库内一个真实存在的 `.js` 文件，且该文件 `require('electron')` 不抛出错误

### Requirement: BrowserWindow 加载本地 loading 页面
主进程 SHALL 在窗口创建后通过 `loadFile()` 加载仓库内打包的本地 HTML 文件（约定为 `electron/loading.html`），不得在 v1 阶段加载任何远程 URL 或 server 响应。

#### Scenario: 窗口加载 loading.html
- **WHEN** `BrowserWindow` 创建完成
- **THEN** 主进程 SHALL 调用 `win.loadFile(path.join(__dirname, 'loading.html'))`，且文档标题或正文 SHALL 包含可见的初始化文案（如 "Initializing..."）

#### Scenario: 不向 renderer 暴露 Node API
- **WHEN** 检查 `BrowserWindow` 的 `webPreferences`
- **THEN** SHALL 满足 `contextIsolation: true` 且 `nodeIntegration: false`

### Requirement: 窗口全部关闭时退出主进程（mac 除外保持惯例）
主进程 SHALL 监听 `window-all-closed` 事件；当事件触发且当前平台不是 `darwin` 时 SHALL 调用 `app.quit()`。在 `darwin` 上 SHALL 遵循 macOS 应用惯例（保持进程驻留 dock）。

#### Scenario: 非 mac 平台关闭最后一个窗口后退出
- **WHEN** 在 `process.platform !== 'darwin'` 的环境下用户关闭所有窗口
- **THEN** 主进程 SHALL 在 1 秒内退出（`app.quit()` 被调用）

#### Scenario: mac 平台关闭窗口后进程不退出
- **WHEN** 在 `darwin` 平台关闭所有窗口
- **THEN** 主进程 SHALL NOT 调用 `app.quit()`

### Requirement: preload 脚本占位文件存在但不暴露 API
系统 SHALL 提供 `electron/preload.js` 文件并在 `BrowserWindow` 的 `webPreferences.preload` 中引用其绝对路径。v1 阶段该文件 MUST NOT 通过 `contextBridge.exposeInMainWorld` 向 renderer 注入任何 API（保留为后续阶段的扩展点）。

#### Scenario: preload 文件存在
- **WHEN** 检查仓库
- **THEN** `electron/preload.js` SHALL 存在，且 `webPreferences.preload` SHALL 引用该路径

#### Scenario: preload 不暴露任何 contextBridge API
- **WHEN** 在 renderer 中访问 `window` 对象
- **THEN** SHALL NOT 找到任何由 preload 注入的自定义全局对象（如 `window.electronAPI`）

### Requirement: 不在 v1 阶段启动后端服务或加载前端构建产物
主进程代码 MUST NOT 在 v1 阶段调用 `child_process.fork`、`child_process.spawn` 或类似 API 启动 NestJS server，也 MUST NOT 加载 `file-uploader-fe` 的构建产物。这些行为由后续 P4 阶段提案引入。

#### Scenario: 主进程不 fork 子进程
- **WHEN** 全文搜索 `electron/main.js`
- **THEN** SHALL NOT 出现 `child_process.fork`、`child_process.spawn`、`child_process.exec` 调用

#### Scenario: 主进程不加载远程或前端 dist
- **WHEN** 全文搜索 `electron/main.js`
- **THEN** `loadURL(http...)` 与 `loadFile` 指向 `web/`、`dist/`、`fe-pc/` 等前端产物的调用 SHALL NOT 出现
