## MODIFIED Requirements

### Requirement: Electron 主进程入口存在且可被启动
系统 SHALL 在 `package.json.main` 字段指定的入口文件（约定为 `electron/main.js`）中创建并展示一个 `BrowserWindow`。`npm start` 命令 SHALL 通过 `electron .` 启动该入口，且在 macOS 上能正常打开窗口、不抛出未捕获异常。打包模式下，安装后的应用 SHALL 同样能正常启动。

#### Scenario: npm start 启动后窗口出现
- **WHEN** 在仓库根目录执行 `npm start`
- **THEN** Electron 进程 SHALL 启动并创建至少一个 `BrowserWindow`，且该窗口在 5 秒内可见

#### Scenario: 主进程入口可被 require 解析
- **WHEN** 检查 `package.json` 的 `main` 字段
- **THEN** 该字段 SHALL 指向仓库内一个真实存在的 `.js` 文件，且该文件 `require('electron')` 不抛出错误

#### Scenario: 打包后安装的应用可正常启动
- **WHEN** 从 dmg 安装应用后双击（或右键→打开）
- **THEN** 应用 SHALL 正常启动，显示 loading 页，进而切换到前端页面
