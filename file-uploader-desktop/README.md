# file-uploader-desktop

Electron 桌面宿主工程，将 `file-uploader-server`（NestJS）与 `file-uploader-fe`（Vue 3）打包为单一可安装的桌面应用。

> **⚠️ 安全提示：本应用不内置任何鉴权机制。**
> 适用场景：单机桌面使用（OS 用户隔离）、家庭/办公室局域网（NAS、可信内网）。
> **请勿直接暴露至公网。** 若需公网访问，请在上游网关层添加鉴权（nginx basic-auth、Cloudflare Access 等）。

---

## 功能

- 双击安装，开箱即用，无需手动部署服务端
- 应用数据（SQLite 数据库、上传文件）存储在系统用户目录
- 局域网内其他设备可通过浏览器访问移动端页面（扫码上传）
- macOS 支持 x64 / arm64，Windows 支持规划中

---

## 架构

```
┌─────────────────────────────────────────────┐
│                Electron 主进程               │
│                                             │
│  ┌──────────────┐   fork   ┌─────────────┐ │
│  │  BrowserWindow│         │  NestJS 子进程│ │
│  │  (Vue 3 前端) │ ←HTTP→  │  :38902      │ │
│  │  file://...  │         └─────────────┘ │
│  └──────────────┘                          │
│                                             │
│  静态服务器 :38903 (0.0.0.0)                  │
│  ↑ 局域网设备通过此端口访问移动端页面             │
└─────────────────────────────────────────────┘
```

- **Electron 主进程**：fork NestJS 子进程，轮询 `/health` 就绪后加载前端页面
- **NestJS 后端**（端口 38902）：提供文件上传/下载/管理 API，SQLite 数据库
- **Vue 3 前端**：桌面端通过 `file://` 协议加载；局域网设备通过静态服务器（端口 38903）访问

---

## 仓库结构

本工程是 `file-uploader` monorepo 的子目录之一，克隆顶层仓库即可获得完整结构：

```
file-uploader/               # 顶层仓库
├── file-uploader-server/    # NestJS 后端
├── file-uploader-fe/        # Vue 3 前端（PC + 移动端）
├── file-uploader-desktop/   # 本仓库（Electron 宿主）
└── file-uploader-app/       # （其他子包）
```

```bash
git clone <file-uploader-url>
cd file-uploader
```

---

## 前置条件

| 依赖 | 最低版本 |
|------|---------|
| Node.js | 18.x |
| npm | 9.x |
| macOS（打包） | 12+ |

---

## 构建与打包

```bash
# 1. 安装依赖
cd file-uploader-desktop
npm install

# 2. 构建资源（触发 server + 前端 build，拷贝产物到 resources/）
npm run build

# 3. 打包 macOS DMG（输出到 dist/）
npm run dist:mac
```

> `npm run build` 会自动调用隔壁仓库的 `npm run build`，请确保两个仓库都已安装依赖。

安装 DMG 后，双击 **FileUploader.app** 即可运行。应用数据位于：
- macOS：`~/Library/Application Support/FileUploader/`

---

## 开发命令

```bash
# 启动 Electron（需先执行 npm run build 准备好 resources/）
npm start

# 检查 desktop 与 server 生产依赖版本是否同步
npm run check-deps
```

---

## 项目文档

- [`docs/electron-packaging.md`](docs/electron-packaging.md)：打包架构路线图与关键技术决策记录

---

## License

[MIT](../LICENSE)
