## REMOVED Requirements

### Requirement: 不在 v1 阶段启动后端服务或加载前端构建产物
**Reason**: P4 阶段正式引入 server fork 与前端加载能力（`server-lifecycle` capability），该限制已完成其历史使命（防止 P3 过早引入复杂度），现予以移除。
**Migration**: 参见 `server-lifecycle` capability 中的相关 requirements，所有 fork/loadFile 行为已在新 spec 中有规范定义。

## MODIFIED Requirements

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
