## 1. package.json 与依赖锁定

- [x] 1.1 创建仓库根 `package.json`，字段：`"name": "file-uploader-desktop"`、`"version": "0.1.0"`、`"private": true`、`"main": "electron/main.js"`
- [x] 1.2 在 `devDependencies` 添加 `electron`（最新稳定版，30.x 系列）与 `electron-builder`
- [x] 1.3 读取 `../file-uploader-server/package.json` 的 `dependencies` 段，逐项抄写到本仓库 `dependencies`，版本字符串保持完全一致
- [x] 1.4 添加 `scripts.start: "electron ."`、`scripts.check-deps: "node scripts/check-deps-sync.js"`、`scripts.prebuild: "npm run check-deps"`
- [x] 1.5 添加占位 `scripts.build: "echo build placeholder for P5"`（让 prebuild 钩子有触发对象，P5 提案再替换为真实 build 命令）

## 2. Electron 主进程骨架

- [x] 2.1 新建 `electron/` 目录
- [x] 2.2 创建 `electron/main.js`：`require('electron')` 拿到 `app`、`BrowserWindow`；`app.whenReady()` 后创建窗口
- [x] 2.3 在 `BrowserWindow` 配置中设 `width: 1200`、`height: 800`、`webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }`
- [x] 2.4 调用 `win.loadFile(path.join(__dirname, 'loading.html'))`
- [x] 2.5 监听 `app.on('window-all-closed', ...)`：非 darwin 平台调用 `app.quit()`
- [x] 2.6 创建 `electron/preload.js` 占位空文件（仅含一行注释说明 v1 不暴露 API）
- [x] 2.7 创建 `electron/loading.html`：原生 HTML + 内联 CSS，居中显示 "Initializing..." 文案，<title>File Uploader</title>

## 3. 依赖同步校验脚本

- [x] 3.1 新建 `scripts/` 目录，创建 `scripts/check-deps-sync.js`
- [x] 3.2 脚本读取 `path.join(__dirname, '..', 'package.json')` 与 `path.join(__dirname, '..', '..', 'file-uploader-server', 'package.json')`
- [x] 3.3 server `package.json` 文件不存在或解析失败时，打印明确报错（含路径与排查建议）并 `process.exit(1)`
- [x] 3.4 取双方 `dependencies` 段（未定义视为空对象），求键集合差集：`onlyInServer`、`onlyInDesktop`
- [x] 3.5 对键交集逐项对比版本字符串严格相等，收集 `versionMismatches`
- [x] 3.6 任一差异不为空则打印分类报告并 `process.exit(1)`；全部通过则打印 "deps sync OK" 并 `process.exit(0)`
- [x] 3.7 脚本仅依赖 Node 内置模块（`fs`、`path`），不引入任何 npm 依赖

## 4. 仓库元文件

- [x] 4.1 创建 `.gitignore`：忽略 `node_modules/`、`dist/`、`release/`、`out/`、`.DS_Store`
- [x] 4.2 创建 `README.md`：包含「项目定位」「目录结构」「开发命令（npm install / npm start / npm run check-deps）」「下一步路线图（指向 docs/electron-packaging.md）」四节

## 5. 验证

- [x] 5.1 在仓库根目录跑 `npm install`，能成功安装（不要求所有 native 依赖编译通过 —— 只要 `electron`、`electron-builder` 可用即可，其他生产依赖在 P4 才会真正被运行时加载）
- [x] 5.2 跑 `npm start`，Electron 窗口打开并显示 "Initializing..." loading 页
- [x] 5.3 关闭窗口后（mac 外平台）主进程在 1 秒内退出
- [x] 5.4 跑 `npm run check-deps`，输出 "deps sync OK"，退出码 0
- [x] 5.5 临时修改 desktop `package.json` 中某个依赖版本号，再跑 `npm run check-deps`，确认非零退出且报告具体差异；恢复后再次通过
- [x] 5.6 跑 `npm run build`（占位 build），确认 prebuild 钩子触发并先跑了 check-deps
- [x] 5.7 跑 `openspec validate desktop-scaffold --strict`，确保提案通过 schema 校验
