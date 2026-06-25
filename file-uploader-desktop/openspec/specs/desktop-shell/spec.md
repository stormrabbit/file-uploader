# desktop-shell

## Purpose

Defines the Electron main-process shell for the desktop application: entry point bootstrap, window creation, security configuration, and lifecycle management. This capability establishes the minimal runnable Electron host that later phases will extend with backend services and frontend assets.

## Requirements

### Requirement: Electron 主进程入口存在且可被启动
系统 SHALL 在 `package.json.main` 字段指定的入口文件（约定为 `electron/main.js`）中创建并展示一个 `BrowserWindow`。`npm start` 命令 SHALL 通过 `electron .` 启动该入口，且在 macOS 上能正常打开窗口、不抛出未捕获异常。

#### Scenario: npm start 启动后窗口出现
- **WHEN** 在仓库根目录执行 `npm start`
- **THEN** Electron 进程 SHALL 启动并创建至少一个 `BrowserWindow`，且该窗口在 5 秒内可见

#### Scenario: 主进程入口可被 require 解析
- **WHEN** 检查 `package.json` 的 `main` 字段
- **THEN** 该字段 SHALL 指向仓库内一个真实存在的 `.js` 文件，且该文件 `require('electron')` 不抛出错误

### Requirement: BrowserWindow 加载本地 loading 页面
主进程 SHALL 在窗口创建后首先通过 `loadFile()` 加载 `electron/loading.html` 作为启动过渡页；当 server 健康检查通过后，主进程 SHALL 切换调用 `win.loadFile()` 加载前端页面（`resources/web/pages/pc/index.html`）。loading 页面是启动期的过渡态，不再是最终呈现页面。

#### Scenario: 启动初期加载 loading.html
- **WHEN** `BrowserWindow` 创建完成，server 尚未就绪
- **THEN** 主进程 SHALL 加载 `electron/loading.html`，窗口显示"Initializing..."文案

#### Scenario: server 就绪后切换到前端页面
- **WHEN** health 轮询收到 200 响应
- **THEN** 主进程 SHALL 调用 `win.loadFile('resources/web/pages/pc/index.html')`，loading 页被替换为前端页面

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

