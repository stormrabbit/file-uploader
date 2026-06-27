## 1. electron-builder 配置

- [x] 1.1 新建仓库根目录 `electron-builder.yml`，填写 `appId: com.fileuploader.app`、`productName: FileUploader`
- [x] 1.2 配置 `mac` 节：`target: [{target: dmg, arch: [x64, arm64]}]`、`identity: null`
- [x] 1.3 配置 `files` 规则：包含 `electron/**`、`resources/**`、`package.json`；排除 `node_modules`、`openspec`、`scripts`、`docs`、`*.md`、`*.mjs`
- [x] 1.4 配置 `asarUnpack`：`resources/server/node_modules/.prisma/client/*.node` 和 `resources/server/node_modules/prisma/*.node`
- [x] 1.5 配置 `dmg` 节：`window: {width: 540, height: 380}`、`contents`（app 图标位置 + Applications 快捷方式位置）
- [x] 1.6 配置 `directories.output: dist`

## 2. package.json 脚本

- [x] 2.1 在 `package.json` 新增 `scripts.dist:mac: "npm run build && electron-builder --mac"`

## 3. electron/main.js 路径适配

- [x] 3.1 将资源路径常量改为通过 `app.isPackaged` 区分：
  - 打包模式：`RESOURCES = path.join(process.resourcesPath, 'resources')`
  - 开发模式：`RESOURCES = path.join(__dirname, '..', 'resources')`
- [x] 3.2 确认 `LOADING_HTML`、`ERROR_HTML`、`preload.js` 路径仍用 `__dirname`（asar 内可读）
- [x] 3.3 确认 `SERVER_MAIN`、`SERVER_NODE_MODULES`、`SERVER_PRISMA_BIN`、`WEB_INDEX` 都基于 `RESOURCES` 常量（已是，无需额外修改）

## 4. 验证：开发模式不受影响

- [x] 4.1 修改 main.js 后执行 `npm start`，确认 loading 页出现、前端正常加载（Playwright 验证通过，页面文本含"简单存储"和"上传文件"）

## 5. 验证：打包与安装

- [x] 5.1 执行 `npm run dist:mac`，观察打包过程无报错（electron-builder 24.13.3，两平台均完成）
- [x] 5.2 确认 `dist/FileUploader-*.dmg` 存在且大小合理（x64: 96MB，arm64: 91MB）
- [x] 5.3 打开 dmg，将 FileUploader.app 拖入 Applications
- [x] 5.4 首次启动（右键→打开），确认 loading 页出现
- [x] 5.5 等待约 5-10s，确认切换到前端 PC 页面
- [x] 5.6 上传一个文件，确认成功
- [x] 5.7 检查 `~/Library/Application Support/FileUploader/` 下存在 `data.db`、`logs/server.log`、上传后的 `static/` 目录
- [x] 5.8 退出应用，确认端口 38902 被释放（`lsof -ti :38902` 无结果）
